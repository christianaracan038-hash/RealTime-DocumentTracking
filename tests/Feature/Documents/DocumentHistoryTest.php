<?php

namespace Tests\Feature\Documents;

use App\Models\Document;
use App\Models\DocumentStatus;
use App\Models\EmployeeAcc;
use App\Models\Role;
use App\Models\Section;
use App\Models\TrackingHistory;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/**
 * History is the archive, and it only grows. A row therefore carries
 * just enough to recognise a document - taxpayer and date - and the
 * rest is fetched one document at a time when someone opens it.
 */
class DocumentHistoryTest extends TestCase
{
    use RefreshDatabase;

    protected Section $rdo;

    protected Section $assessment;

    protected Section $finance;

    protected EmployeeAcc $clerk;

    protected function setUp(): void
    {
        parent::setUp();

        DocumentStatus::create(['status_name' => 'Pending', 'status_color' => 'yellow', 'sort_order' => 1]);
        DocumentStatus::create(['status_name' => 'Received', 'status_color' => 'green', 'sort_order' => 2]);

        $this->rdo = Section::create(['section_code' => '1002', 'section_name' => 'RDO', 'is_active' => true]);
        $this->assessment = Section::create(['section_code' => '1001', 'section_name' => 'ASSESSMENT', 'is_active' => true]);
        $this->finance = Section::create(['section_code' => '1004', 'section_name' => 'COLLECTION', 'is_active' => true]);

        $role = Role::create(['role_name' => 'Staff', 'is_active' => true]);

        $this->clerk = EmployeeAcc::create([
            'username' => 'rdo.staff',
            'password' => 'password',
            'section_id' => $this->rdo->section_id,
            'role_id' => $role->role_id,
            'is_active' => true,
        ]);
    }

    protected function makeDocument(int $moves = 0): Document
    {
        $document = Document::create([
            'tracking_number' => 'DOC-20260923-'.str_pad((string) (Document::count() + 1), 6, '0', STR_PAD_LEFT),
            'qr_value' => 'QR-'.uniqid(),
            'document_date' => '2026-09-23',
            'taxpayer_name' => 'Juan Dela Cruz',
            'concern' => 'Tax Assumption',
            'referred_for' => 'Approval',
            'remarks' => 'Processing',
            'status_id' => 1,
            'current_section_id' => $this->rdo->section_id,
            'current_employee_id' => $this->clerk->employee_id,
            'destination_section_id' => $this->assessment->section_id,
            'addressee' => 'Chief',
            'created_by' => $this->clerk->employee_id,
            'details_completed_at' => now(),
            'details_completed_by' => $this->clerk->employee_id,
        ]);

        foreach (range(1, $moves) as $i) {
            TrackingHistory::create([
                'document_id' => $document->document_id,
                'from_section_id' => $this->rdo->section_id,
                'to_section_id' => $this->assessment->section_id,
                'employee_id' => $this->clerk->employee_id,
                'status_id' => 2,
                'action' => $i % 2 ? 'RECEIVED' : 'FORWARDED',
                'remarks' => "Move {$i}.",
                'tracked_at' => now()->addMinutes($i),
            ]);
        }

        return $document;
    }

    public function test_a_history_row_carries_only_what_it_shows(): void
    {
        $this->makeDocument(moves: 4);

        $listed = $this->actingAs($this->clerk, 'employee')
            ->get(route('documents.history'))
            ->viewData('page')['props']['documents']['data'][0];

        // What a row needs.
        $this->assertArrayHasKey('taxpayer_name', $listed);
        $this->assertArrayHasKey('document_date', $listed);
        $this->assertArrayHasKey('status', $listed);

        // What it does not: the trail is the expensive part.
        $this->assertArrayNotHasKey('tracking_histories', $listed);
        $this->assertArrayNotHasKey('current_employee', $listed);
        $this->assertArrayNotHasKey('creator', $listed);
        $this->assertArrayNotHasKey('destination_section', $listed);
    }

    public function test_listing_history_costs_the_same_however_much_a_document_has_moved(): void
    {
        $documents = collect(range(1, 3))->map(fn () => $this->makeDocument());

        $this->actingAs($this->clerk, 'employee');

        // Warm up first: the very first request also establishes the
        // session, which would otherwise be counted as page cost.
        $this->get(route('documents.history'))->assertOk();

        DB::enableQueryLog();
        $this->get(route('documents.history'))->assertOk();
        $before = count(DB::getQueryLog());

        // The same three documents, now heavily travelled.
        $documents->each(function (Document $document) {
            foreach (range(1, 10) as $i) {
                TrackingHistory::create([
                    'document_id' => $document->document_id,
                    'from_section_id' => $this->rdo->section_id,
                    'to_section_id' => $this->assessment->section_id,
                    'employee_id' => $this->clerk->employee_id,
                    'status_id' => 2,
                    'action' => 'FORWARDED',
                    'remarks' => "Move {$i}.",
                    'tracked_at' => now()->addMinutes($i),
                ]);
            }
        });

        DB::flushQueryLog();
        $this->get(route('documents.history'))->assertOk();
        $after = count(DB::getQueryLog());

        DB::disableQueryLog();

        $this->assertSame(
            $before,
            $after,
            'Thirty movements must not add a single query to the list.'
        );
    }

    public function test_opening_a_document_returns_its_full_detail_and_trail(): void
    {
        $document = $this->makeDocument(moves: 3);

        $body = $this->actingAs($this->clerk, 'employee')
            ->getJson(route('documents.detail', $document))
            ->assertOk()
            ->json('document');

        $this->assertSame('Juan Dela Cruz', $body['taxpayer_name']);
        $this->assertSame('Tax Assumption', $body['concern']);
        $this->assertSame('Approval', $body['referred_for']);
        $this->assertSame('Processing', $body['remarks']);

        $this->assertCount(3, $body['tracking_histories']);

        // Each movement is readable on its own.
        $first = $body['tracking_histories'][0];
        $this->assertSame('RECEIVED', $first['action']);
        $this->assertSame('RDO', $first['from_section']['section_name']);
        $this->assertSame('ASSESSMENT', $first['to_section']['section_name']);
        $this->assertSame('rdo.staff', $first['employee']['username']);
    }

    public function test_the_trail_is_ordered_oldest_first(): void
    {
        $document = $this->makeDocument(moves: 3);

        $trail = $this->actingAs($this->clerk, 'employee')
            ->getJson(route('documents.detail', $document))
            ->json('document.tracking_histories');

        $this->assertSame(['Move 1.', 'Move 2.', 'Move 3.'], array_column($trail, 'remarks'));
    }

    public function test_a_document_you_may_not_see_is_answered_as_not_found(): void
    {
        $document = $this->makeDocument();

        // A section with no connection to the document at all.
        $outsider = EmployeeAcc::create([
            'username' => 'collection.staff',
            'password' => 'password',
            'section_id' => $this->finance->section_id,
            'role_id' => Role::first()->role_id,
            'is_active' => true,
        ]);

        $this->actingAs($outsider, 'employee')
            ->getJson(route('documents.detail', $document))
            ->assertNotFound();

        // And it is not in their history either - the same rule decides both.
        $listed = $this->actingAs($outsider, 'employee')
            ->get(route('documents.history'))
            ->viewData('page')['props']['documents']['data'];

        $this->assertCount(0, $listed);
    }

    public function test_the_detail_is_closed_to_guests(): void
    {
        $document = $this->makeDocument();

        $this->get(route('documents.detail', $document))
            ->assertRedirect('/login');
    }

    public function test_a_section_that_once_handled_a_document_can_still_open_it(): void
    {
        $document = $this->makeDocument();

        // Collection handled it once, then it moved on.
        $collectionStaff = EmployeeAcc::create([
            'username' => 'collection.clerk',
            'password' => 'password',
            'section_id' => $this->finance->section_id,
            'role_id' => Role::first()->role_id,
            'is_active' => true,
        ]);

        TrackingHistory::create([
            'document_id' => $document->document_id,
            'from_section_id' => $this->finance->section_id,
            'to_section_id' => $this->assessment->section_id,
            'employee_id' => $collectionStaff->employee_id,
            'status_id' => 1,
            'action' => 'FORWARDED',
            'remarks' => 'Passed on.',
            'tracked_at' => now(),
        ]);

        $this->actingAs($collectionStaff, 'employee')
            ->getJson(route('documents.detail', $document))
            ->assertOk();
    }
}
