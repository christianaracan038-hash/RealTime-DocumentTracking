<?php

namespace Tests\Feature\Documents;

use App\Models\Document;
use App\Models\DocumentStatus;
use App\Models\EmployeeAcc;
use App\Models\Role;
use App\Models\Section;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * How a person is named, and to whom.
 *
 * The office asked for names to stay inside the section: Compliance sees
 * that a document was received by the RDO's Office, and the RDO sees
 * which of its own people received it. Nothing individual goes on the
 * printed slip at all.
 *
 * This is pinned down by tests because it is a decision that is easy to
 * make now and hard to walk back - once names have been visible
 * office-wide for a month, removing them looks like a regression.
 */
class EmployeeIdentityTest extends TestCase
{
    use RefreshDatabase;

    protected EmployeeAcc $chief;

    protected EmployeeAcc $colleague;

    protected EmployeeAcc $outsider;

    protected function setUp(): void
    {
        parent::setUp();

        DocumentStatus::create(['status_name' => 'Pending', 'status_color' => 'yellow', 'sort_order' => 1]);
        DocumentStatus::create(['status_name' => 'Received', 'status_color' => 'green', 'sort_order' => 2]);

        $rdo = Section::create(['section_code' => '1002', 'section_name' => 'RDO', 'is_active' => true]);
        $compliance = Section::create(['section_code' => '1005', 'section_name' => 'COMPLIANCE', 'is_active' => true]);

        $role = Role::create(['role_name' => 'Staff', 'is_active' => true]);

        $this->chief = EmployeeAcc::create([
            'username' => 'rdo.staff',
            'full_name' => 'John Dela Cruz',
            'position' => 'Atty.',
            'password' => 'password',
            'section_id' => $rdo->section_id,
            'role_id' => $role->role_id,
            'is_active' => true,
        ]);

        $this->colleague = EmployeeAcc::create([
            'username' => 'rdo.counter',
            'full_name' => 'Maria Santos',
            'password' => 'password',
            'section_id' => $rdo->section_id,
            'role_id' => $role->role_id,
            'is_active' => true,
        ]);

        $this->outsider = EmployeeAcc::create([
            'username' => 'compliance.staff',
            'full_name' => 'Pedro Reyes',
            'password' => 'password',
            'section_id' => $compliance->section_id,
            'role_id' => $role->role_id,
            'is_active' => true,
        ]);
    }

    public function test_a_title_sits_in_front_of_the_name(): void
    {
        $this->assertSame('Atty. John Dela Cruz', $this->chief->display_name);

        // No title, so the name stands alone.
        $this->assertSame('Maria Santos', $this->colleague->display_name);
    }

    public function test_an_unnamed_account_falls_back_to_its_username(): void
    {
        $this->chief->update(['full_name' => null, 'position' => null]);

        /*
         * Nine accounts predate the name columns. A username is poor, but
         * a blank where a person should be is worse.
         */
        $this->assertSame('rdo.staff', $this->chief->fresh()->display_name);
    }

    public function test_a_colleague_in_the_same_section_sees_the_name(): void
    {
        $this->assertSame(
            'Atty. John Dela Cruz',
            $this->chief->nameVisibleTo($this->colleague)
        );
    }

    public function test_another_section_does_not_see_the_name(): void
    {
        $this->assertNull($this->chief->nameVisibleTo($this->outsider));
    }

    public function test_nobody_in_particular_sees_no_name(): void
    {
        // Forces the caller to fall back to the section rather than
        // leaking a name by forgetting to check.
        $this->assertNull($this->chief->nameVisibleTo(null));
    }

    public function test_a_name_does_not_travel_in_a_document_payload(): void
    {
        $document = Document::create([
            'tracking_number' => 'DOC-20260926-000001',
            'qr_value' => 'DOC-20260926-000001',
            'taxpayer_name' => 'Juan Taxpayer',
            'document_date' => '2026-09-26',
            'status_id' => 1,
            'current_section_id' => $this->chief->section_id,
            'current_employee_id' => $this->chief->employee_id,
            'destination_section_id' => $this->outsider->section_id,
            'created_by' => $this->chief->employee_id,
            'details_completed_at' => now(),
            'details_completed_by' => $this->chief->employee_id,
        ]);

        /*
         * Compliance is waiting for this document, so it receives the
         * creator and the current holder in its queue. Neither should
         * arrive carrying a name - display_name is deliberately not
         * appended to the model for exactly this reason.
         */
        $body = $this->actingAs($this->outsider, 'employee')
            ->get(route('compliance.dashboard'))
            ->assertOk()
            ->viewData('page');

        $payload = json_encode($body['props']['documents']);

        $this->assertStringNotContainsString('John Dela Cruz', $payload);
        $this->assertStringNotContainsString('display_name', $payload);

        // The document itself is there - it is only the name that is not.
        $this->assertStringContainsString($document->tracking_number, $payload);
    }
}
