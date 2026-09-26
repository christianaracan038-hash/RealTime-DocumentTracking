<?php

namespace Tests\Feature\Documents;

use App\Models\Document;
use App\Models\DocumentStatus;
use App\Models\EmployeeAcc;
use App\Models\Role;
use App\Models\Section;
use App\Services\DashboardResolver;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * The RDO counter runs on two accounts.
 *
 * The first registers arrivals as taxpayers hand documents over - two
 * fields, no routing decisions, nothing else on screen. The second fills
 * in the referral details afterwards, on the Referrals page.
 */
class RegistrationDeskTest extends TestCase
{
    use RefreshDatabase;

    protected Section $rdo;

    protected Section $assessment;

    protected EmployeeAcc $counter;

    protected EmployeeAcc $encoder;

    protected function setUp(): void
    {
        parent::setUp();

        DocumentStatus::create(['status_name' => 'Pending', 'status_color' => 'yellow', 'sort_order' => 1]);
        DocumentStatus::create(['status_name' => 'Received', 'status_color' => 'green', 'sort_order' => 2]);

        $this->rdo = Section::create(['section_code' => '1002', 'section_name' => 'RDO', 'is_active' => true]);
        $this->assessment = Section::create(['section_code' => '1001', 'section_name' => 'ASSESSMENT', 'is_active' => true]);

        $staff = Role::create(['role_name' => 'Staff', 'is_active' => true]);

        $desk = Role::create([
            'role_name' => config('referral.registration_roles')[0],
            'is_active' => true,
        ]);

        // Step 1 - the counter.
        $this->counter = EmployeeAcc::create([
            'username' => 'rdo.counter', 'password' => 'password',
            'section_id' => $this->rdo->section_id, 'role_id' => $desk->role_id, 'is_active' => true,
        ]);

        // Step 2 - the same section, the full portal.
        $this->encoder = EmployeeAcc::create([
            'username' => 'rdo.staff', 'password' => 'password',
            'section_id' => $this->rdo->section_id, 'role_id' => $staff->role_id, 'is_active' => true,
        ]);
    }

    public function test_step_one_records_a_taxpayer_and_a_date_and_nothing_else(): void
    {
        $this->actingAs($this->counter, 'employee')
            ->post(route('documents.store'), [
                'taxpayer_name' => 'Juan Dela Cruz',
                'document_date' => '2026-09-26',
            ])
            ->assertRedirect();

        $document = Document::first();

        $this->assertSame('Juan Dela Cruz', $document->taxpayer_name);

        // The clock is running and it has a reference number and a QR.
        $this->assertSame(1, $document->status_id);
        $this->assertNotNull($document->tracking_number);
        $this->assertNotNull($document->qr_value);

        /*
         * But it has nowhere to go yet, which is what keeps a
         * half-registered referral from being forwarded on.
         */
        $this->assertNull($document->destination_section_id);
        $this->assertNull($document->addressee);
        $this->assertNull($document->details_completed_at);
    }

    public function test_step_one_does_not_ask_for_a_receiving_section(): void
    {
        $this->actingAs($this->counter, 'employee')
            ->post(route('documents.store'), ['taxpayer_name' => 'Juan Dela Cruz'])
            ->assertSessionHasErrors('document_date');

        $this->actingAs($this->counter, 'employee')
            ->post(route('documents.store'), ['document_date' => '2026-09-26'])
            ->assertSessionHasErrors('taxpayer_name');

        // Neither field is required any more.
        $this->actingAs($this->counter, 'employee')
            ->post(route('documents.store'), [
                'taxpayer_name' => 'Juan Dela Cruz',
                'document_date' => '2026-09-26',
            ])
            ->assertSessionHasNoErrors();
    }

    public function test_a_document_without_a_destination_cannot_be_received(): void
    {
        $this->actingAs($this->counter, 'employee')->post(route('documents.store'), [
            'taxpayer_name' => 'Juan Dela Cruz',
            'document_date' => '2026-09-26',
        ]);

        $document = Document::first();

        // Nobody's section matches a destination that is not set.
        $this->actingAs($this->encoder, 'employee')
            ->postJson("/api/documents/{$document->document_id}/receive")
            ->assertStatus(403);

        // Nor can it be scanned as an arrival.
        $this->actingAs($this->encoder, 'employee')
            ->postJson('/api/documents/scan', [
                'qr_value' => $document->qr_value,
                'mode' => 'receive',
            ])
            ->assertStatus(403);
    }

    public function test_a_counter_account_lands_on_the_desk(): void
    {
        $this->assertSame(
            route('registration.index'),
            DashboardResolver::resolve($this->counter)
        );

        $this->assertSame(
            route('rdo.dashboard'),
            DashboardResolver::resolve($this->encoder)
        );
    }

    public function test_a_counter_account_is_sent_back_to_the_desk_from_anywhere_else(): void
    {
        $this->actingAs($this->counter, 'employee');

        $this->get(route('registration.index'))->assertOk();

        foreach (['rdo.dashboard', 'referrals.index', 'documents.index', 'documents.history', 'comments.index'] as $name) {
            $this->get(route($name))->assertRedirect(route('registration.index'));
        }
    }

    public function test_the_full_portal_is_untouched_for_everyone_else(): void
    {
        $this->actingAs($this->encoder, 'employee');

        $this->get(route('rdo.dashboard'))->assertOk();
        $this->get(route('referrals.index'))->assertOk();
        $this->get(route('documents.history'))->assertOk();
    }

    public function test_the_desk_lists_only_what_this_account_registered(): void
    {
        $this->actingAs($this->counter, 'employee')->post(route('documents.store'), [
            'taxpayer_name' => 'Mine', 'document_date' => '2026-09-26',
        ]);

        $this->actingAs($this->encoder, 'employee')->post(route('documents.store'), [
            'taxpayer_name' => 'Somebody Else', 'document_date' => '2026-09-26',
        ]);

        $page = $this->actingAs($this->counter, 'employee')
            ->get(route('registration.index'))
            ->assertOk()
            ->viewData('page');

        $names = collect($page['props']['registered']['data'])->pluck('taxpayer_name');

        $this->assertTrue($names->contains('Mine'));
        $this->assertFalse($names->contains('Somebody Else'));
    }

    public function test_step_two_completes_the_routing_and_the_details(): void
    {
        $this->actingAs($this->counter, 'employee')->post(route('documents.store'), [
            'taxpayer_name' => 'Juan Dela Cruz',
            'document_date' => '2026-09-26',
        ]);

        $document = Document::first();

        $this->actingAs($this->encoder, 'employee')
            ->patch(route('documents.complete', $document), [
                'concerns' => ['Tax Assumption'],
                'referred_for' => ['Approval'],
                'remarks' => 'Processing',
                'destination_section_id' => $this->assessment->section_id,
                'addressee' => 'Chief',
            ])
            ->assertRedirect();

        $document->refresh();

        $this->assertSame($this->assessment->section_id, $document->destination_section_id);
        $this->assertSame('Chief', $document->addressee);
        $this->assertSame('Tax Assumption', $document->concern);
        $this->assertNotNull($document->details_completed_at);
        $this->assertSame($this->encoder->employee_id, $document->details_completed_by);
    }

    public function test_step_two_insists_on_a_receiving_section(): void
    {
        $this->actingAs($this->counter, 'employee')->post(route('documents.store'), [
            'taxpayer_name' => 'Juan Dela Cruz',
            'document_date' => '2026-09-26',
        ]);

        $this->actingAs($this->encoder, 'employee')
            ->patch(route('documents.complete', Document::first()), [
                'concerns' => ['Tax Assumption'],
                'referred_for' => ['Approval'],
                'remarks' => 'Processing',
            ])
            ->assertSessionHasErrors(['destination_section_id', 'addressee']);
    }

    public function test_the_referrals_page_lists_what_is_waiting_oldest_first(): void
    {
        $this->actingAs($this->counter, 'employee');

        $this->post(route('documents.store'), ['taxpayer_name' => 'First In', 'document_date' => '2026-09-24']);

        $this->travel(1)->hour();

        $this->post(route('documents.store'), ['taxpayer_name' => 'Second In', 'document_date' => '2026-09-25']);

        // One already finished: it belongs in History, not here.
        $done = Document::create([
            'tracking_number' => 'DOC-20260926-000999',
            'qr_value' => 'QR-done',
            'taxpayer_name' => 'Already Done',
            'document_date' => '2026-09-20',
            'status_id' => 1,
            'current_section_id' => $this->rdo->section_id,
            'destination_section_id' => $this->assessment->section_id,
            'created_by' => $this->encoder->employee_id,
            'details_completed_at' => now(),
            'details_completed_by' => $this->encoder->employee_id,
        ]);

        $page = $this->actingAs($this->encoder, 'employee')
            ->get(route('referrals.index'))
            ->assertOk()
            ->viewData('page');

        $names = collect($page['props']['awaitingDetails']['data'])->pluck('taxpayer_name');

        $this->assertSame(['First In', 'Second In'], $names->all());
        $this->assertFalse($names->contains($done->taxpayer_name));
    }

    public function test_the_sidebar_count_is_what_the_section_still_has_to_complete(): void
    {
        $this->actingAs($this->counter, 'employee');

        $this->post(route('documents.store'), ['taxpayer_name' => 'One', 'document_date' => '2026-09-26']);
        $this->post(route('documents.store'), ['taxpayer_name' => 'Two', 'document_date' => '2026-09-26']);

        $page = $this->actingAs($this->encoder, 'employee')
            ->get(route('referrals.index'))
            ->assertOk()
            ->viewData('page');

        $this->assertSame(2, $page['props']['awaitingDetailsCount']);

        // Completing one takes it off the count.
        $this->actingAs($this->encoder, 'employee')
            ->patch(route('documents.complete', Document::first()), [
                'concerns' => ['Tax Assumption'],
                'referred_for' => ['Approval'],
                'remarks' => 'Processing',
                'destination_section_id' => $this->assessment->section_id,
                'addressee' => 'Chief',
            ]);

        $page = $this->actingAs($this->encoder, 'employee')
            ->get(route('referrals.index'))
            ->assertOk()
            ->viewData('page');

        $this->assertSame(1, $page['props']['awaitingDetailsCount']);
    }
}
