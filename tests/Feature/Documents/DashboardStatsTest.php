<?php

namespace Tests\Feature\Documents;

use App\Models\Document;
use App\Models\DocumentStatus;
use App\Models\EmployeeAcc;
use App\Models\Role;
use App\Models\Section;
use App\Models\TrackingHistory;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * The three numbers at the top of a section dashboard.
 *
 * Counted in the controller rather than in the page, so the figures are
 * the same ones the list below is built from - a count that disagrees
 * with the list under it is worse than no count.
 */
class DashboardStatsTest extends TestCase
{
    use RefreshDatabase;

    protected Section $rdo;

    protected Section $compliance;

    protected EmployeeAcc $clerk;

    protected EmployeeAcc $colleague;

    protected function setUp(): void
    {
        parent::setUp();

        DocumentStatus::create(['status_name' => 'Pending', 'status_color' => 'yellow', 'sort_order' => 1]);
        DocumentStatus::create(['status_name' => 'Received', 'status_color' => 'green', 'sort_order' => 2]);
        DocumentStatus::create(['status_name' => 'Completed', 'status_color' => 'blue', 'sort_order' => 3]);

        $this->rdo = Section::create(['section_code' => '1002', 'section_name' => 'RDO', 'is_active' => true]);
        $this->compliance = Section::create(['section_code' => '1005', 'section_name' => 'COMPLIANCE', 'is_active' => true]);

        $role = Role::create(['role_name' => 'Staff', 'is_active' => true]);

        $this->clerk = EmployeeAcc::create([
            'username' => 'rdo.staff', 'password' => 'password',
            'section_id' => $this->rdo->section_id, 'role_id' => $role->role_id, 'is_active' => true,
        ]);

        $this->colleague = EmployeeAcc::create([
            'username' => 'rdo.other', 'password' => 'password',
            'section_id' => $this->rdo->section_id, 'role_id' => $role->role_id, 'is_active' => true,
        ]);
    }

    protected function document(array $attributes = []): Document
    {
        return Document::create(array_merge([
            'tracking_number' => 'DOC-20260928-'.str_pad((string) (Document::count() + 1), 6, '0', STR_PAD_LEFT),
            'qr_value' => 'QR-'.uniqid(),
            'taxpayer_name' => 'Juan Dela Cruz',
            'document_date' => '2026-09-28',
            'status_id' => 1,
            'current_section_id' => $this->compliance->section_id,
            'destination_section_id' => $this->rdo->section_id,
            'created_by' => $this->clerk->employee_id,
            'details_completed_at' => now(),
            'details_completed_by' => $this->clerk->employee_id,
        ], $attributes));
    }

    protected function stats(): array
    {
        return $this->actingAs($this->clerk, 'employee')
            ->get(route('rdo.dashboard'))
            ->assertOk()
            ->viewData('page')['props']['stats'];
    }

    public function test_waiting_matches_the_list_below_it(): void
    {
        $this->document();
        $this->document();

        // Destined elsewhere, so not ours to receive.
        $this->document(['destination_section_id' => $this->compliance->section_id]);

        $page = $this->actingAs($this->clerk, 'employee')
            ->get(route('rdo.dashboard'))
            ->assertOk()
            ->viewData('page')['props'];

        $this->assertSame(2, $page['stats']['waiting']);
        $this->assertCount(2, $page['documents'], 'The count and the list agree.');
    }

    public function test_on_your_desk_is_yours_and_not_the_sections(): void
    {
        // Received by this person.
        $this->document([
            'status_id' => 2,
            'current_section_id' => $this->rdo->section_id,
            'current_employee_id' => $this->clerk->employee_id,
            'received_at' => now(),
        ]);

        // Received by a colleague in the same section.
        $this->document([
            'status_id' => 2,
            'current_section_id' => $this->rdo->section_id,
            'current_employee_id' => $this->colleague->employee_id,
            'received_at' => now(),
        ]);

        $this->assertSame(1, $this->stats()['onDesk']);
    }

    public function test_a_completed_document_is_not_on_anybodys_desk(): void
    {
        $this->document([
            'status_id' => 3,
            'current_section_id' => $this->rdo->section_id,
            'current_employee_id' => $this->clerk->employee_id,
            'completed_at' => now(),
        ]);

        $this->assertSame(0, $this->stats()['onDesk']);
    }

    public function test_overdue_counts_only_what_is_past_the_limit(): void
    {
        $fresh = $this->document();

        $late = $this->document();
        $late->forceFill(['created_at' => now()->subDays(3)])->saveQuietly();

        $stats = $this->stats();

        $this->assertSame(2, $stats['waiting']);
        $this->assertSame(1, $stats['overdue']);

        $this->assertNotNull($fresh);
    }

    public function test_the_wait_restarts_when_a_document_is_forwarded(): void
    {
        $document = $this->document();
        $document->forceFill(['created_at' => now()->subDays(4)])->saveQuietly();

        /*
         * Registered four days ago, but forwarded to us an hour ago - the
         * clock runs from the movement, so this is not our delay and must
         * not be counted against us.
         */
        TrackingHistory::create([
            'document_id' => $document->document_id,
            'from_section_id' => $this->compliance->section_id,
            'to_section_id' => $this->rdo->section_id,
            'employee_id' => $this->clerk->employee_id,
            'status_id' => 1,
            'action' => 'FORWARDED',
            'tracked_at' => now()->subHour(),
        ]);

        $this->assertSame(0, $this->stats()['overdue']);
    }

    public function test_an_empty_desk_reads_zero_rather_than_nothing(): void
    {
        $stats = $this->stats();

        $this->assertSame(0, $stats['waiting']);
        $this->assertSame(0, $stats['onDesk']);
        $this->assertSame(0, $stats['overdue']);
    }
}
