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
 * Registering a referral (BIR Form 2309), in two steps.
 *
 * Step 1, at the counter: the routing facts, so the clock starts when
 * the document actually arrives and it can be forwarded the same
 * morning. Step 2, later and usually by someone else: the descriptive
 * fields.
 */
class ReferralRegistrationTest extends TestCase
{
    use RefreshDatabase;

    protected Section $rdo;

    protected Section $compliance;

    protected EmployeeAcc $clerk;

    protected EmployeeAcc $encoder;

    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake('public');

        DocumentStatus::create(['status_name' => 'Pending', 'status_color' => 'yellow', 'sort_order' => 1]);
        DocumentStatus::create(['status_name' => 'Received', 'status_color' => 'green', 'sort_order' => 2]);
        DocumentStatus::create(['status_name' => 'Completed', 'status_color' => 'blue', 'sort_order' => 3]);

        $this->rdo = Section::create([
            'section_code' => '1002',
            'section_name' => 'RDO',
            'description' => "RDO's/ARDO's Office",
            'is_active' => true,
        ]);

        $this->compliance = Section::create([
            'section_code' => '1005',
            'section_name' => 'COMPLIANCE',
            'description' => 'Compliance Section',
            'is_active' => true,
        ]);

        $role = Role::create(['role_name' => 'Staff', 'is_active' => true]);

        // Step 1: the person at the counter.
        $this->clerk = EmployeeAcc::create([
            'username' => 'rdo.staff',
            'password' => 'password',
            'section_id' => $this->rdo->section_id,
            'role_id' => $role->role_id,
            'is_active' => true,
        ]);

        // Step 2: a colleague in the same section, later in the day.
        $this->encoder = EmployeeAcc::create([
            'username' => 'rdo.encoder',
            'password' => 'password',
            'section_id' => $this->rdo->section_id,
            'role_id' => $role->role_id,
            'is_active' => true,
        ]);
    }

    protected function arrival(array $overrides = []): array
    {
        return array_merge([
            'document_date' => '2026-09-22',
            'taxpayer_name' => 'Juan Dela Cruz',
            'destination_section_id' => $this->compliance->section_id,
            'addressee' => 'Chief',
        ], $overrides);
    }

    protected function details(array $overrides = []): array
    {
        return array_merge([
            'concerns' => ['Promissory Note'],
            'referred_for' => ['Approval'],
            'remarks' => 'Processing',
        ], $overrides);
    }

    protected function registerArrival(): Document
    {
        $this->actingAs($this->clerk, 'employee')
            ->post(route('documents.store'), $this->arrival())
            ->assertSessionHasNoErrors();

        return Document::latest('document_id')->first();
    }

    /*
    |--------------------------------------------------------------------------
    | Step 1 - the arrival
    |--------------------------------------------------------------------------
    */

    public function test_step_one_records_the_arrival_and_starts_the_clock(): void
    {
        $this->actingAs($this->clerk, 'employee')
            ->post(route('documents.store'), $this->arrival())
            ->assertSessionHas('success');

        $document = Document::first();

        // The routing facts, read off the paper.
        $this->assertSame('Juan Dela Cruz', $document->taxpayer_name);
        $this->assertSame($this->compliance->section_id, (int) $document->destination_section_id);
        $this->assertSame('Chief', $document->addressee);

        // Produced by the system, now - this is when the clock starts.
        $this->assertMatchesRegularExpression('/^DOC-\d{8}-\d{6}$/', $document->tracking_number);
        $this->assertSame($document->tracking_number, $document->qr_value);
        $this->assertNotNull($document->qr_generated_at);
        $this->assertSame('1002', $document->office_code);
        $this->assertSame($this->clerk->employee_id, (int) $document->created_by);

        Storage::disk('public')->assertExists('qrcodes/'.$document->qr_value.'.svg');

        // Pending, so it is routable immediately.
        $this->assertSame(1, (int) $document->status_id);

        // But the paperwork is not done.
        $this->assertTrue($document->awaiting_details);
        $this->assertNull($document->concern);
        $this->assertNull($document->referred_for);
        $this->assertNull($document->remarks);
    }

    public function test_step_one_does_not_ask_for_the_descriptive_fields(): void
    {
        $this->actingAs($this->clerk, 'employee')
            ->post(route('documents.store'), $this->arrival())
            ->assertSessionHasNoErrors();

        $this->assertSame(1, Document::count());
    }

    public function test_step_one_requires_every_routing_fact(): void
    {
        $this->actingAs($this->clerk, 'employee')
            ->post(route('documents.store'), [])
            ->assertSessionHasErrors([
                'document_date',
                'taxpayer_name',
                'destination_section_id',
                'addressee',
            ]);

        $this->assertSame(0, Document::count());
    }

    /*
    |--------------------------------------------------------------------------
    | The point of the split
    |--------------------------------------------------------------------------
    */

    public function test_a_referral_can_be_forwarded_before_its_details_are_filled_in(): void
    {
        $document = $this->registerArrival();

        $receiver = EmployeeAcc::create([
            'username' => 'compliance.staff',
            'password' => 'password',
            'section_id' => $this->compliance->section_id,
            'role_id' => Role::first()->role_id,
            'is_active' => true,
        ]);

        // Compliance sees it waiting, the same morning.
        $listed = $this->actingAs($receiver, 'employee')
            ->get(route('compliance.dashboard'))
            ->viewData('page')['props']['documents'];

        $this->assertCount(1, $listed);
        $this->assertTrue($listed[0]['awaiting_details']);

        // And can receive it.
        $this->actingAs($receiver, 'employee')
            ->postJson("/api/documents/{$document->document_id}/receive")
            ->assertOk();

        $this->assertSame(2, (int) $document->fresh()->status_id);
    }

    public function test_the_clock_starts_at_step_one_not_step_two(): void
    {
        $document = $this->registerArrival();

        $registeredAt = $document->created_at;
        $qrAt = $document->qr_generated_at;

        $this->travel(9)->hours();

        $this->actingAs($this->encoder, 'employee')
            ->patch(route('documents.complete', $document), $this->details())
            ->assertSessionHasNoErrors();

        $document->refresh();

        $this->assertTrue($registeredAt->equalTo($document->created_at), 'Completing must not restart the clock.');
        $this->assertTrue($qrAt->equalTo($document->qr_generated_at), 'The QR keeps its original time.');
        $this->assertTrue($document->details_completed_at->greaterThan($registeredAt));
    }

    /*
    |--------------------------------------------------------------------------
    | Step 2 - the details
    |--------------------------------------------------------------------------
    */

    public function test_a_colleague_can_complete_a_referral_someone_else_registered(): void
    {
        $document = $this->registerArrival();

        $this->actingAs($this->encoder, 'employee')
            ->patch(route('documents.complete', $document), $this->details([
                'concerns' => ['Tax Assumption', 'Promissory Note'],
                'referred_for' => ['Approval', 'Signature'],
            ]))
            ->assertRedirect(route('referrals.index'))
            ->assertSessionHas('success');

        $document->refresh();

        $this->assertSame('Tax Assumption, Promissory Note', $document->concern);
        $this->assertSame('Approval, Signature', $document->referred_for);
        $this->assertSame('Processing', $document->remarks);

        $this->assertFalse($document->awaiting_details);
        $this->assertSame(
            $this->encoder->employee_id,
            (int) $document->details_completed_by,
            'Both halves of the work are attributable.'
        );
        $this->assertSame($this->clerk->employee_id, (int) $document->created_by);
    }

    public function test_ticking_other_requires_the_text_and_stores_it_in_place(): void
    {
        $document = $this->registerArrival();

        $this->actingAs($this->encoder, 'employee')
            ->patch(route('documents.complete', $document), $this->details([
                'concerns' => ['Other'],
                'referred_for' => ['Other'],
                'remarks' => 'Other',
            ]))
            ->assertSessionHasErrors(['concern_other', 'referred_for_other', 'remarks_other']);

        $this->assertTrue($document->fresh()->awaiting_details);

        $this->actingAs($this->encoder, 'employee')
            ->patch(route('documents.complete', $document), $this->details([
                'concerns' => ['Tax Assumption', 'Other'],
                'concern_other' => 'Lost receipt',
                'referred_for' => ['Other'],
                'referred_for_other' => 'Return to taxpayer',
                'remarks' => 'Other',
                'remarks_other' => 'Waiting for the taxpayer to call back.',
            ]))
            ->assertSessionHasNoErrors();

        $document->refresh();

        $this->assertSame('Tax Assumption, Lost receipt', $document->concern);
        $this->assertSame('Return to taxpayer', $document->referred_for);
        $this->assertSame('Waiting for the taxpayer to call back.', $document->remarks);
    }

    public function test_details_cannot_be_completed_twice(): void
    {
        $document = $this->registerArrival();

        $this->actingAs($this->encoder, 'employee')
            ->patch(route('documents.complete', $document), $this->details())
            ->assertSessionHasNoErrors();

        $this->actingAs($this->encoder, 'employee')
            ->patch(route('documents.complete', $document), $this->details(['remarks' => 'Complied']))
            ->assertForbidden();

        $this->assertSame('Processing', $document->fresh()->remarks);
    }

    public function test_only_the_configured_sections_may_complete_details(): void
    {
        $document = $this->registerArrival();

        $outsider = EmployeeAcc::create([
            'username' => 'compliance.clerk',
            'password' => 'password',
            'section_id' => $this->compliance->section_id,
            'role_id' => Role::first()->role_id,
            'is_active' => true,
        ]);

        $this->actingAs($outsider, 'employee')
            ->patch(route('documents.complete', $document), $this->details())
            ->assertForbidden();

        $this->assertTrue($document->fresh()->awaiting_details);
    }

    public function test_a_referral_left_bare_by_the_old_draft_flow_can_be_caught_up(): void
    {
        // What the earlier flow produced: a tracking number and nothing else.
        $bare = Document::create([
            'tracking_number' => 'DOC-20260920-000099',
            'qr_value' => 'DOC-20260920-000099',
            'status_id' => 1,
            'current_section_id' => $this->rdo->section_id,
            'current_employee_id' => $this->clerk->employee_id,
            'created_by' => $this->clerk->employee_id,
        ]);

        // The routing facts are missing, so they are asked for here.
        $this->actingAs($this->encoder, 'employee')
            ->patch(route('documents.complete', $bare), $this->details())
            ->assertSessionHasErrors([
                'taxpayer_name',
                'document_date',
                'destination_section_id',
                'addressee',
            ]);

        $this->actingAs($this->encoder, 'employee')
            ->patch(route('documents.complete', $bare), $this->details($this->arrival()))
            ->assertSessionHasNoErrors();

        $bare->refresh();

        $this->assertSame('Juan Dela Cruz', $bare->taxpayer_name);
        $this->assertSame($this->compliance->section_id, (int) $bare->destination_section_id);
        $this->assertFalse($bare->awaiting_details);
    }

    /*
    |--------------------------------------------------------------------------
    | Closing the document
    |--------------------------------------------------------------------------
    */

    public function test_a_document_cannot_be_closed_while_its_details_are_missing(): void
    {
        $document = $this->registerArrival();

        $receiver = EmployeeAcc::create([
            'username' => 'compliance.staff',
            'password' => 'password',
            'section_id' => $this->compliance->section_id,
            'role_id' => Role::first()->role_id,
            'is_active' => true,
        ]);

        $this->actingAs($receiver, 'employee')
            ->postJson("/api/documents/{$document->document_id}/receive")
            ->assertOk();

        $this->actingAs($receiver, 'employee')
            ->postJson("/api/documents/{$document->document_id}/complete")
            ->assertStatus(409);

        $this->assertSame(2, (int) $document->fresh()->status_id);

        // Once the details are in, it can be closed.
        $this->actingAs($this->encoder, 'employee')
            ->patch(route('documents.complete', $document), $this->details())
            ->assertSessionHasNoErrors();

        $this->actingAs($receiver, 'employee')
            ->postJson("/api/documents/{$document->document_id}/complete")
            ->assertOk();

        $this->assertSame(3, (int) $document->fresh()->status_id);
    }

    /*
    |--------------------------------------------------------------------------
    | The page
    |--------------------------------------------------------------------------
    */

    public function test_the_referrals_page_lists_what_is_awaiting_details(): void
    {
        $this->registerArrival();

        $props = $this->actingAs($this->encoder, 'employee')
            ->get(route('referrals.index'))
            ->assertOk()
            ->viewData('page')['props'];

        $this->assertCount(1, $props['awaitingDetails']);
        $this->assertTrue($props['canCompleteDetails'], 'RDO may do step 2.');
        $this->assertSame(config('referral'), $props['referralOptions']);

        // You cannot refer a document to your own section.
        $offered = collect($props['sections'])->pluck('section_id');
        $this->assertFalse($offered->contains($this->rdo->section_id));
        $this->assertTrue($offered->contains($this->compliance->section_id));
    }

    public function test_the_referral_can_be_found_by_concern_and_remarks(): void
    {
        $document = $this->registerArrival();

        $this->actingAs($this->encoder, 'employee')
            ->patch(route('documents.complete', $document), $this->details([
                'remarks' => 'Other',
                'remarks_other' => 'Awaiting signature of the Assistant Chief.',
            ]))
            ->assertSessionHasNoErrors();

        foreach (['juan', 'promissory', 'assistant chief', 'approval', '1002'] as $keyword) {
            $response = $this->actingAs($this->clerk, 'employee')
                ->get(route('referrals.index', ['search' => $keyword]));

            $this->assertCount(
                1,
                $response->viewData('page')['props']['referrals']['data'],
                "Expected a match for [{$keyword}]."
            );
        }
    }

    public function test_the_old_registration_page_redirects_to_the_referrals_page(): void
    {
        $this->actingAs($this->clerk, 'employee')
            ->get(route('documents.create'))
            ->assertRedirect(route('referrals.index'));
    }
}
