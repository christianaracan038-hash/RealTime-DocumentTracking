<?php

namespace Tests\Feature\Documents;

use App\Models\Document;
use App\Models\DocumentStatus;
use App\Models\EmployeeAcc;
use App\Models\Role;
use App\Models\Section;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

/**
 * Registering a referral complete, in one pass.
 *
 * The two-step split earns its keep at the counter, where a taxpayer is
 * standing there and a name and a date are all anybody has time to take.
 * At a desk with the document in hand it only meant filling a short form
 * to unlock a longer one, so the Referrals page asks for everything at
 * once and the counter keeps step 1 to itself.
 */
class OnePassReferralTest extends TestCase
{
    use RefreshDatabase;

    protected Section $rdo;

    protected Section $compliance;

    protected EmployeeAcc $clerk;

    protected EmployeeAcc $counter;

    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake('public');

        DocumentStatus::create(['status_name' => 'Pending', 'status_color' => 'yellow', 'sort_order' => 1]);
        DocumentStatus::create(['status_name' => 'Received', 'status_color' => 'green', 'sort_order' => 2]);

        $this->rdo = Section::create(['section_code' => '1002', 'section_name' => 'RDO', 'is_active' => true]);
        $this->compliance = Section::create(['section_code' => '1005', 'section_name' => 'COMPLIANCE', 'is_active' => true]);

        $staff = Role::create(['role_name' => 'Staff', 'is_active' => true]);

        $desk = Role::create([
            'role_name' => config('referral.registration_roles')[0],
            'is_active' => true,
        ]);

        $this->clerk = EmployeeAcc::create([
            'username' => 'rdo.staff', 'password' => 'password',
            'section_id' => $this->rdo->section_id, 'role_id' => $staff->role_id, 'is_active' => true,
        ]);

        $this->counter = EmployeeAcc::create([
            'username' => 'rdo.counter', 'password' => 'password',
            'section_id' => $this->rdo->section_id, 'role_id' => $desk->role_id, 'is_active' => true,
        ]);
    }

    protected function referral(array $overrides = []): array
    {
        return array_merge([
            'taxpayer_name' => 'Juan Dela Cruz',
            'document_date' => '2026-09-22',
            'destination_section_id' => $this->compliance->section_id,
            'addressee' => 'Chief',
            'concerns' => ['Promissory Note'],
            'referred_for' => ['Approval'],
            'remarks' => 'Processing',
        ], $overrides);
    }

    public function test_one_pass_produces_a_finished_referral(): void
    {
        $this->actingAs($this->clerk, 'employee')
            ->post(route('referrals.store'), $this->referral())
            ->assertSessionHasNoErrors();

        $document = Document::first();

        // The arrival.
        $this->assertSame('Juan Dela Cruz', $document->taxpayer_name);

        // The routing, which step 1 alone never sets.
        $this->assertSame($this->compliance->section_id, (int) $document->destination_section_id);
        $this->assertSame('Chief', $document->addressee);

        // The description.
        $this->assertSame('Promissory Note', $document->concern);
        $this->assertSame('Approval', $document->referred_for);
        $this->assertSame('Processing', $document->remarks);

        // Produced by the system, as step 1 would have.
        $this->assertMatchesRegularExpression('/^DOC-\d{8}-\d{6}$/', $document->tracking_number);
        $this->assertSame($document->tracking_number, $document->qr_value);
        $this->assertSame('1002', $document->office_code);
        Storage::disk('public')->assertExists('qrcodes/'.$document->qr_value.'.svg');

        // And nothing is outstanding on it.
        $this->assertFalse($document->awaiting_details);
        $this->assertNotNull($document->details_completed_at);
        $this->assertSame($this->clerk->employee_id, (int) $document->details_completed_by);

        // The clock is running and it can be routed.
        $this->assertSame(1, (int) $document->status_id);
    }

    public function test_it_can_be_received_straight_away(): void
    {
        $this->actingAs($this->clerk, 'employee')
            ->post(route('referrals.store'), $this->referral());

        $document = Document::first();

        $receiver = EmployeeAcc::create([
            'username' => 'compliance.staff', 'password' => 'password',
            'section_id' => $this->compliance->section_id,
            'role_id' => Role::first()->role_id, 'is_active' => true,
        ]);

        $this->actingAs($receiver, 'employee')
            ->postJson("/api/documents/{$document->document_id}/receive")
            ->assertOk();

        $this->assertSame(2, (int) $document->fresh()->status_id);
    }

    public function test_it_lands_back_on_the_register_with_its_slip_open(): void
    {
        $response = $this->actingAs($this->clerk, 'employee')
            ->post(route('referrals.store'), $this->referral());

        $document = Document::first();

        $response->assertRedirect(
            route('referrals.index', ['slip' => $document->document_id])
        );

        $props = $this->actingAs($this->clerk, 'employee')
            ->get(route('referrals.index', ['slip' => $document->document_id]))
            ->assertOk()
            ->viewData('page')['props'];

        $this->assertSame($document->document_id, $props['openSlipFor']);
    }

    public function test_every_part_of_the_referral_is_required(): void
    {
        $this->actingAs($this->clerk, 'employee')
            ->post(route('referrals.store'), [])
            ->assertSessionHasErrors([
                'taxpayer_name',
                'document_date',
                'destination_section_id',
                'addressee',
                'concerns',
                'referred_for',
                'remarks',
            ]);

        $this->assertSame(0, Document::count());
    }

    public function test_ticking_other_asks_what_it_is(): void
    {
        $this->actingAs($this->clerk, 'employee')
            ->post(route('referrals.store'), $this->referral([
                'concerns' => ['Other'],
                'remarks' => 'Other',
            ]))
            ->assertSessionHasErrors(['concern_other', 'remarks_other']);

        $this->actingAs($this->clerk, 'employee')
            ->post(route('referrals.store'), $this->referral([
                'concerns' => ['Other'],
                'concern_other' => 'Compromise settlement',
                'remarks' => 'Other',
                'remarks_other' => 'Awaiting signature of the Assistant Chief.',
            ]))
            ->assertSessionHasNoErrors();

        $document = Document::first();

        // Stored in place of the word "Other", as on the paper form.
        $this->assertSame('Compromise settlement', $document->concern);
        $this->assertSame('Awaiting signature of the Assistant Chief.', $document->remarks);
    }

    public function test_nothing_is_created_when_the_details_are_rejected(): void
    {
        /*
         * Both halves run in one transaction, so a referral is never left
         * with a reference number and no details - which is what a
         * half-failed one-pass registration would otherwise leave behind.
         */
        $this->actingAs($this->clerk, 'employee')
            ->post(route('referrals.store'), $this->referral(['remarks' => 'Not a real remark']))
            ->assertSessionHasErrors('remarks');

        $this->assertSame(0, Document::count());
    }

    public function test_the_counter_form_still_takes_two_fields_only(): void
    {
        /*
         * Step 1 is deliberately narrow, and the one-pass form is a
         * separate endpoint rather than a flag on it - otherwise the
         * counter's form could carry routing it is not meant to decide.
         */
        $this->actingAs($this->counter, 'employee')
            ->post(route('documents.store'), [
                'taxpayer_name' => 'Juan Dela Cruz',
                'document_date' => '2026-09-22',
                'destination_section_id' => $this->compliance->section_id,
                'addressee' => 'Chief',
            ])
            ->assertSessionHasNoErrors();

        $document = Document::first();

        $this->assertNull($document->destination_section_id);
        $this->assertNull($document->addressee);
        $this->assertTrue($document->awaiting_details);
    }

    public function test_a_one_pass_referral_is_counted_as_having_a_slip(): void
    {
        $this->actingAs($this->clerk, 'employee')
            ->post(route('referrals.store'), $this->referral());

        $props = $this->actingAs($this->clerk, 'employee')
            ->get(route('referrals.index'))
            ->assertOk()
            ->viewData('page')['props'];

        $this->assertSame(1, $props['counts']['all']);
        $this->assertSame(1, $props['counts']['slip']);
        $this->assertSame(0, $props['counts']['waiting']);
    }
}
