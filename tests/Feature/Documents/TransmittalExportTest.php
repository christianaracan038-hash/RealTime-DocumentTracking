<?php

namespace Tests\Feature\Documents;

use App\Models\AuditLog;
use App\Models\Document;
use App\Models\DocumentStatus;
use App\Models\EmployeeAcc;
use App\Models\Role;
use App\Models\Section;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use PhpOffice\PhpSpreadsheet\IOFactory;
use Tests\TestCase;

/**
 * The transmittal, exported to Excel.
 *
 * The same set the printed sheet lists, as a file the office can total
 * and keep. These tests open the real spreadsheet rather than inspecting
 * the export object, because the thing that gets emailed around is the
 * file, and what matters is what is in its cells.
 */
class TransmittalExportTest extends TestCase
{
    use RefreshDatabase;

    protected Section $css;

    protected Section $admin;

    protected Section $collection;

    protected EmployeeAcc $clerk;

    protected function setUp(): void
    {
        parent::setUp();

        DocumentStatus::create(['status_name' => 'Pending', 'status_color' => 'yellow', 'sort_order' => 1]);
        DocumentStatus::create(['status_name' => 'Received', 'status_color' => 'green', 'sort_order' => 2]);
        DocumentStatus::create(['status_name' => 'Completed', 'status_color' => 'blue', 'sort_order' => 3]);

        $this->css = Section::create([
            'section_code' => '1006',
            'section_name' => 'CSS',
            'description' => 'Client Support Section',
            'is_active' => true,
        ]);

        $this->admin = Section::create([
            'section_code' => '1003',
            'section_name' => 'ADMIN',
            'description' => 'Administrative Section',
            'is_active' => true,
        ]);

        $this->collection = Section::create([
            'section_code' => '1004',
            'section_name' => 'COLLECTION',
            'description' => 'Collection Section',
            'is_active' => true,
        ]);

        $this->clerk = EmployeeAcc::create([
            'username' => 'css.staff',
            'full_name' => 'Ann Reyes',
            'position' => 'Administrative Aide',
            'password' => 'password',
            'section_id' => $this->css->section_id,
            'role_id' => Role::create(['role_name' => 'Staff', 'is_active' => true])->role_id,
            'is_active' => true,
        ]);
    }

    protected function document(array $overrides = [], ?string $createdAt = null): Document
    {
        $document = Document::create(array_merge([
            'tracking_number' => 'DOC-20260930-'.str_pad((string) (Document::count() + 1), 6, '0', STR_PAD_LEFT),
            'qr_value' => 'QR-'.uniqid(),
            'taxpayer_name' => 'Juan Dela Cruz',
            'document_date' => '2026-09-30',
            'concern' => 'Tax Assumption',
            'status_id' => 1,
            'current_section_id' => $this->css->section_id,
            'destination_section_id' => $this->admin->section_id,
            'created_by' => $this->clerk->employee_id,
            'details_completed_at' => now(),
            'details_completed_by' => $this->clerk->employee_id,
        ], $overrides));

        if ($createdAt) {
            $document->created_at = Carbon::parse($createdAt);
            $document->save();
        }

        return $document;
    }

    /**
     * Download the export and read the sheet back as rows of cells.
     *
     * @return array<int, array<int, string|null>>
     */
    protected function rows(array $query = []): array
    {
        $response = $this->actingAs($this->clerk, 'employee')
            ->get(route('transmittal.export', $query));

        $response->assertOk();

        $downloaded = $response->baseResponse->getFile()->getPathname();

        $copy = tempnam(sys_get_temp_dir(), 'transmittal').'.xlsx';
        file_put_contents($copy, file_get_contents($downloaded));

        $rows = IOFactory::load($copy)->getActiveSheet()->toArray();

        @unlink($copy);

        return $rows;
    }

    /**
     * One row by tracking number, headings mapped onto it.
     *
     * @return array<string, string|null>
     */
    protected function row(array $rows, string $trackingNumber): array
    {
        $headings = $rows[0];

        foreach (array_slice($rows, 1) as $row) {
            if (in_array($trackingNumber, $row, true)) {
                return array_combine($headings, $row);
            }
        }

        $this->fail('No row for '.$trackingNumber.' in the export.');
    }

    /**
     * Every cell below the headings, flattened - for asking whether
     * something is in the file at all.
     *
     * @return array<int, string>
     */
    protected function cells(array $rows): array
    {
        return collect(array_slice($rows, 1))->flatten()->filter()->values()->all();
    }

    public function test_the_to_column_names_each_rows_own_destination(): void
    {
        $toAdmin = $this->document();
        $toCollection = $this->document([
            'destination_section_id' => $this->collection->section_id,
        ]);

        /*
         * No `to`, so one sheet covers every destination - which is
         * exactly the case that a single receiving section stamped on
         * the whole file gets wrong.
         */
        $rows = $this->rows();

        $this->assertSame(
            'Administrative Section',
            $this->row($rows, $toAdmin->tracking_number)['To']
        );

        $this->assertSame(
            'Collection Section',
            $this->row($rows, $toCollection->tracking_number)['To']
        );
    }

    public function test_the_from_column_is_the_exporting_section(): void
    {
        $document = $this->document();

        $this->assertSame(
            'Client Support Section',
            $this->row($this->rows(), $document->tracking_number)['From']
        );
    }

    public function test_the_date_filter_matches_the_registered_column(): void
    {
        $inside = $this->document([], '2026-09-15 09:00:00');
        $before = $this->document([], '2026-09-01 09:00:00');
        $after = $this->document([], '2026-10-01 09:00:00');

        $rows = $this->rows(['from' => '2026-09-10', 'until' => '2026-09-20']);

        $cells = $this->cells($rows);

        $this->assertContains($inside->tracking_number, $cells);
        $this->assertNotContains($before->tracking_number, $cells);
        $this->assertNotContains($after->tracking_number, $cells);

        /*
         * And the date it filtered on is in the file, so the export can
         * be checked against the dates that produced it.
         */
        $this->assertStringContainsString(
            'Sep 15, 2026',
            $this->row($rows, $inside->tracking_number)['Registered']
        );
    }

    public function test_the_last_day_of_the_range_is_included(): void
    {
        $document = $this->document([], '2026-09-20 16:30:00');

        $rows = $this->rows(['from' => '2026-09-10', 'until' => '2026-09-20']);

        $this->assertContains($document->tracking_number, $this->cells($rows));
    }

    public function test_it_exports_only_what_is_in_transit(): void
    {
        $going = $this->document();
        $ours = $this->document(['destination_section_id' => $this->css->section_id]);
        $draft = $this->document(['destination_section_id' => null]);

        $cells = $this->cells($this->rows());

        $this->assertContains($going->tracking_number, $cells);
        $this->assertNotContains($ours->tracking_number, $cells);
        $this->assertNotContains($draft->tracking_number, $cells);
    }

    public function test_no_employee_name_appears_anywhere_in_the_file(): void
    {
        $this->document();

        /*
         * The printed sheet names who released the stack, because it is
         * handed over in person and signed for. A file gets emailed and
         * forwarded, so names stay inside the section that owns them -
         * the same rule as the hidden name columns on EmployeeAcc.
         */
        $everything = collect($this->rows())->flatten()->filter()->implode(' | ');

        $this->assertStringNotContainsString('Ann Reyes', $everything);
        $this->assertStringNotContainsString('css.staff', $everything);
        $this->assertStringNotContainsString('Administrative Aide', $everything);
    }

    public function test_the_export_is_recorded_in_the_audit_log(): void
    {
        $this->document();
        $this->document();

        $this->rows(['to' => $this->admin->section_id]);

        $entry = AuditLog::where('action', 'transmittal.exported')->sole();

        $this->assertSame($this->clerk->employee_id, $entry->actor_id);
        $this->assertSame($this->admin->section_id, $entry->context['to_section_id']);
        $this->assertSame(2, $entry->context['documents']);
        $this->assertStringContainsString('.xlsx', $entry->context['filename']);
    }

    public function test_a_guest_cannot_export(): void
    {
        $this->get(route('transmittal.export'))->assertRedirect(route('login'));
    }

    public function test_an_upside_down_date_range_is_refused(): void
    {
        $this->actingAs($this->clerk, 'employee')
            ->get(route('transmittal.export', ['from' => '2026-09-20', 'until' => '2026-09-10']))
            ->assertSessionHasErrors('until');
    }
}
