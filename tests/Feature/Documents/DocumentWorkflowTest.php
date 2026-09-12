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
 * Receive and forward are the only two operations that move a document,
 * and both run inside a locked transaction. These tests pin down the
 * authorization rules, the status transitions, and the tracking-history
 * writes that the audit trail depends on.
 */
class DocumentWorkflowTest extends TestCase
{
    use RefreshDatabase;

    protected Section $rdo;

    protected Section $assessment;

    protected Section $finance;

    protected EmployeeAcc $rdoStaff;

    protected EmployeeAcc $assessmentStaff;

    protected EmployeeAcc $assessmentColleague;

    protected function setUp(): void
    {
        parent::setUp();

        /*
        * The controllers compare hard-coded status IDs, so Pending
        * must be created first (id 1) and Received second (id 2).
        */
        DocumentStatus::create(['status_name' => 'Pending', 'status_color' => 'yellow', 'description' => 'Registered.', 'sort_order' => 1]);
        DocumentStatus::create(['status_name' => 'Received', 'status_color' => 'green', 'description' => 'Received.', 'sort_order' => 2]);

        $this->rdo = Section::create(['section_code' => 'RDO', 'section_name' => 'RDO', 'is_active' => true]);
        $this->assessment = Section::create(['section_code' => 'ASSESSMENT', 'section_name' => 'ASSESSMENT', 'is_active' => true]);
        $this->finance = Section::create(['section_code' => 'FINANCE', 'section_name' => 'FINANCE', 'is_active' => true]);

        $role = Role::create(['role_name' => 'Staff', 'is_active' => true]);

        $this->rdoStaff = $this->makeEmployee('rdo.staff', $this->rdo, $role);
        $this->assessmentStaff = $this->makeEmployee('assessment.staff', $this->assessment, $role);
        $this->assessmentColleague = $this->makeEmployee('assessment.colleague', $this->assessment, $role);
    }

    protected function makeEmployee(string $username, Section $section, Role $role): EmployeeAcc
    {
        return EmployeeAcc::create([
            'username' => $username,
            'password' => 'password',
            'section_id' => $section->section_id,
            'role_id' => $role->role_id,
            'is_active' => true,
        ]);
    }

    /**
     * A document registered by RDO staff and routed to Assessment,
     * exactly as DocumentService::register() would leave it.
     */
    protected function registerDocument(): Document
    {
        return Document::create([
            'tracking_number' => 'DOC-20260912-'.str_pad((string) (Document::count() + 1), 6, '0', STR_PAD_LEFT),
            'qr_value' => 'QR-'.uniqid(),
            'document_date' => now()->toDateString(),
            'taxpayer_name' => 'Juan Dela Cruz',
            'transaction_type' => 'Tax Clearance',
            'description' => 'Test document',
            'status_id' => 1,
            'current_section_id' => $this->rdo->section_id,
            'current_employee_id' => $this->rdoStaff->employee_id,
            'destination_section_id' => $this->assessment->section_id,
            'created_by' => $this->rdoStaff->employee_id,
        ]);
    }

    /**
     * Shortcut to a document that Assessment has already received.
     */
    protected function receivedDocument(): Document
    {
        $document = $this->registerDocument();

        $this->actingAs($this->assessmentStaff, 'employee')
            ->postJson("/api/documents/{$document->document_id}/receive")
            ->assertOk();

        return $document->fresh();
    }

    /*
    |--------------------------------------------------------------------------
    | Scan (pre-flight check)
    |--------------------------------------------------------------------------
    */

    public function test_scan_rejects_an_unknown_qr_code(): void
    {
        $this->actingAs($this->assessmentStaff, 'employee')
            ->postJson('/api/documents/scan', ['qr_value' => 'nothing-here'])
            ->assertNotFound();
    }

    public function test_scan_for_receiving_is_refused_outside_the_destination_section(): void
    {
        $document = $this->registerDocument();

        $this->actingAs($this->rdoStaff, 'employee')
            ->postJson('/api/documents/scan', ['qr_value' => $document->qr_value, 'mode' => 'receive'])
            ->assertForbidden();
    }

    public function test_scan_for_receiving_succeeds_for_the_destination_section(): void
    {
        $document = $this->registerDocument();

        $this->actingAs($this->assessmentStaff, 'employee')
            ->postJson('/api/documents/scan', ['qr_value' => $document->qr_value, 'mode' => 'receive'])
            ->assertOk()
            ->assertJsonPath('mode', 'receive')
            ->assertJsonPath('document.document_id', $document->document_id);
    }

    public function test_scan_for_forwarding_offers_every_section_except_the_holders_own(): void
    {
        $document = $this->receivedDocument();

        $response = $this->actingAs($this->assessmentStaff, 'employee')
            ->postJson('/api/documents/scan', ['qr_value' => $document->qr_value, 'mode' => 'forward'])
            ->assertOk()
            ->assertJsonPath('mode', 'forward');

        $offered = collect($response->json('sections'))->pluck('section_id');

        $this->assertNotContains($this->assessment->section_id, $offered);
        $this->assertContains($this->rdo->section_id, $offered);
        $this->assertContains($this->finance->section_id, $offered);
    }

    /*
    |--------------------------------------------------------------------------
    | Receive
    |--------------------------------------------------------------------------
    */

    public function test_the_destination_section_can_receive_a_pending_document(): void
    {
        $document = $this->registerDocument();

        $this->actingAs($this->assessmentStaff, 'employee')
            ->postJson("/api/documents/{$document->document_id}/receive")
            ->assertOk()
            ->assertJsonPath('success', true);

        $document->refresh();

        $this->assertSame(2, (int) $document->status_id, 'Status should be Received.');
        $this->assertSame($this->assessment->section_id, (int) $document->current_section_id);
        $this->assertSame($this->assessmentStaff->employee_id, (int) $document->current_employee_id);
        $this->assertNotNull($document->received_at);
    }

    public function test_receiving_writes_a_tracking_history_row(): void
    {
        $document = $this->registerDocument();

        $this->actingAs($this->assessmentStaff, 'employee')
            ->postJson("/api/documents/{$document->document_id}/receive")
            ->assertOk();

        $this->assertDatabaseHas('tracking_histories', [
            'document_id' => $document->document_id,
            'from_section_id' => $this->rdo->section_id,
            'to_section_id' => $this->assessment->section_id,
            'employee_id' => $this->assessmentStaff->employee_id,
            'status_id' => 2,
            'action' => 'RECEIVED',
        ]);
    }

    public function test_only_the_destination_section_can_receive(): void
    {
        $document = $this->registerDocument();

        $this->actingAs($this->rdoStaff, 'employee')
            ->postJson("/api/documents/{$document->document_id}/receive")
            ->assertForbidden();

        $document->refresh();

        $this->assertSame(1, (int) $document->status_id, 'A refused receive must not change status.');
        $this->assertSame(0, TrackingHistory::count(), 'A refused receive must not write history.');
    }

    public function test_a_document_cannot_be_received_twice(): void
    {
        $document = $this->registerDocument();

        $this->actingAs($this->assessmentStaff, 'employee')
            ->postJson("/api/documents/{$document->document_id}/receive")
            ->assertOk();

        /*
        * A colleague in the same section scans the same QR a moment later.
        */
        $this->actingAs($this->assessmentColleague, 'employee')
            ->postJson("/api/documents/{$document->document_id}/receive")
            ->assertStatus(409);

        $document->refresh();

        $this->assertSame(
            $this->assessmentStaff->employee_id,
            (int) $document->current_employee_id,
            'The first receiver keeps the document.'
        );

        $this->assertSame(1, TrackingHistory::count(), 'Only one RECEIVED row should exist.');
    }

    public function test_receiving_requires_an_employee_session(): void
    {
        $document = $this->registerDocument();

        $this->postJson("/api/documents/{$document->document_id}/receive")
            ->assertUnauthorized();
    }

    /*
    |--------------------------------------------------------------------------
    | Forward
    |--------------------------------------------------------------------------
    */

    public function test_a_pending_document_cannot_be_forwarded(): void
    {
        $document = $this->registerDocument();

        $this->actingAs($this->rdoStaff, 'employee')
            ->postJson("/api/documents/{$document->document_id}/forward", [
                'destination_section_id' => $this->finance->section_id,
            ])
            ->assertStatus(409);
    }

    public function test_only_the_current_holder_can_forward(): void
    {
        $document = $this->receivedDocument();

        /*
        * Same section, but not the employee who received it.
        */
        $this->actingAs($this->assessmentColleague, 'employee')
            ->postJson("/api/documents/{$document->document_id}/forward", [
                'destination_section_id' => $this->finance->section_id,
            ])
            ->assertForbidden();

        $this->assertSame(2, (int) $document->fresh()->status_id, 'A refused forward must not change status.');
    }

    public function test_a_document_cannot_be_forwarded_to_its_own_section(): void
    {
        $document = $this->receivedDocument();

        $this->actingAs($this->assessmentStaff, 'employee')
            ->postJson("/api/documents/{$document->document_id}/forward", [
                'destination_section_id' => $this->assessment->section_id,
            ])
            ->assertStatus(422);
    }

    public function test_forwarding_requires_a_real_destination_section(): void
    {
        $document = $this->receivedDocument();

        $this->actingAs($this->assessmentStaff, 'employee')
            ->postJson("/api/documents/{$document->document_id}/forward", [
                'destination_section_id' => 9999,
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('destination_section_id');
    }

    public function test_the_holder_can_forward_a_received_document(): void
    {
        $document = $this->receivedDocument();

        $this->actingAs($this->assessmentStaff, 'employee')
            ->postJson("/api/documents/{$document->document_id}/forward", [
                'destination_section_id' => $this->finance->section_id,
            ])
            ->assertOk()
            ->assertJsonPath('success', true);

        $document->refresh();

        /*
        * Forwarding hands the document back to Pending: the new
        * destination has not received it yet.
        */
        $this->assertSame(1, (int) $document->status_id);
        $this->assertNull($document->received_at);
        $this->assertSame($this->finance->section_id, (int) $document->destination_section_id);

        /*
        * Until Finance scans it, it physically stays with Assessment.
        */
        $this->assertSame($this->assessment->section_id, (int) $document->current_section_id);
        $this->assertSame($this->assessmentStaff->employee_id, (int) $document->current_employee_id);
    }

    public function test_forwarding_writes_a_tracking_history_row(): void
    {
        $document = $this->receivedDocument();

        $this->actingAs($this->assessmentStaff, 'employee')
            ->postJson("/api/documents/{$document->document_id}/forward", [
                'destination_section_id' => $this->finance->section_id,
            ])
            ->assertOk();

        $this->assertDatabaseHas('tracking_histories', [
            'document_id' => $document->document_id,
            'from_section_id' => $this->assessment->section_id,
            'to_section_id' => $this->finance->section_id,
            'employee_id' => $this->assessmentStaff->employee_id,
            'status_id' => 1,
            'action' => 'FORWARDED',
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | Full cycle
    |--------------------------------------------------------------------------
    */

    public function test_a_document_can_travel_through_several_sections_and_keeps_its_full_trail(): void
    {
        $financeStaff = $this->makeEmployee('finance.staff', $this->finance, Role::first());

        $document = $this->registerDocument();

        // RDO -> Assessment
        $this->actingAs($this->assessmentStaff, 'employee')
            ->postJson("/api/documents/{$document->document_id}/receive")
            ->assertOk();

        // Assessment -> Finance
        $this->actingAs($this->assessmentStaff, 'employee')
            ->postJson("/api/documents/{$document->document_id}/forward", [
                'destination_section_id' => $this->finance->section_id,
            ])
            ->assertOk();

        // Finance receives
        $this->actingAs($financeStaff, 'employee')
            ->postJson("/api/documents/{$document->document_id}/receive")
            ->assertOk();

        $document->refresh();

        $this->assertSame(2, (int) $document->status_id);
        $this->assertSame($this->finance->section_id, (int) $document->current_section_id);
        $this->assertSame($financeStaff->employee_id, (int) $document->current_employee_id);

        $trail = TrackingHistory::where('document_id', $document->document_id)
            ->orderBy('tracking_history_id')
            ->pluck('action')
            ->all();

        $this->assertSame(['RECEIVED', 'FORWARDED', 'RECEIVED'], $trail);

        /*
        * Assessment handled it once and moved it on, yet the audit
        * trail must still show it passed through Assessment.
        */
        $this->assertTrue(
            TrackingHistory::where('document_id', $document->document_id)
                ->where(fn ($q) => $q
                    ->where('from_section_id', $this->assessment->section_id)
                    ->orWhere('to_section_id', $this->assessment->section_id))
                ->exists()
        );
    }
}
