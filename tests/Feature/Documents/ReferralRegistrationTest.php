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
 * Registering a referral (BIR Form 2309).
 *
 * The clerk supplies what is on the paper; the system supplies the
 * reference number, QR code, sending section and office code.
 */
class ReferralRegistrationTest extends TestCase
{
    use RefreshDatabase;

    protected Section $rdo;

    protected Section $compliance;

    protected EmployeeAcc $clerk;

    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake('public');

        DocumentStatus::create(['status_name' => 'Pending', 'status_color' => 'yellow', 'sort_order' => 1]);

        $this->rdo = Section::create([
            'section_code' => '1002',
            'section_name' => 'RDO',
            'description' => 'Revenue District Office',
            'is_active' => true,
        ]);

        $this->compliance = Section::create([
            'section_code' => '1005',
            'section_name' => 'COMPLIANCE',
            'description' => 'Compliance Section',
            'is_active' => true,
        ]);

        $role = Role::create(['role_name' => 'Staff', 'is_active' => true]);

        $this->clerk = EmployeeAcc::create([
            'username' => 'rdo.staff',
            'password' => 'password',
            'section_id' => $this->rdo->section_id,
            'role_id' => $role->role_id,
            'is_active' => true,
        ]);
    }

    protected function validReferral(array $overrides = []): array
    {
        return array_merge([
            'document_date' => '2026-09-13',
            'taxpayer_name' => 'Juan Dela Cruz',
            'concern' => 'Promissory Note',
            'referred_for' => 'Approval',
            'remarks' => 'For the Chief to approve.',
            'destination_section_id' => $this->compliance->section_id,
            'addressee' => 'Chief',
        ], $overrides);
    }

    public function test_a_clerk_can_register_a_referral(): void
    {
        $this->actingAs($this->clerk, 'employee')
            ->post(route('documents.store'), $this->validReferral())
            ->assertRedirect(route('documents.create'))
            ->assertSessionHas('success');

        $document = Document::first();

        $this->assertNotNull($document);

        // What the clerk typed.
        $this->assertSame('Juan Dela Cruz', $document->taxpayer_name);
        $this->assertSame('Promissory Note', $document->concern);
        $this->assertSame('Approval', $document->referred_for);
        $this->assertSame('For the Chief to approve.', $document->remarks);
        $this->assertSame('Chief', $document->addressee);
        $this->assertSame($this->compliance->section_id, (int) $document->destination_section_id);

        // What the system filled in.
        $this->assertMatchesRegularExpression('/^DOC-\d{8}-\d{6}$/', $document->tracking_number);
        $this->assertSame($document->tracking_number, $document->qr_value);
        $this->assertSame('1002', $document->office_code, 'Office code is copied from the sending section.');
        $this->assertSame($this->rdo->section_id, (int) $document->current_section_id);
        $this->assertSame($this->clerk->employee_id, (int) $document->created_by);
        $this->assertSame(1, (int) $document->status_id, 'A new referral is Pending.');

        Storage::disk('public')->assertExists('qrcodes/'.$document->qr_value.'.svg');
    }

    public function test_remarks_are_optional(): void
    {
        $this->actingAs($this->clerk, 'employee')
            ->post(route('documents.store'), $this->validReferral(['remarks' => '']))
            ->assertSessionHasNoErrors();

        $this->assertNull(Document::first()->remarks);
    }

    public function test_transaction_type_and_description_are_no_longer_asked_for(): void
    {
        $this->actingAs($this->clerk, 'employee')
            ->post(route('documents.store'), $this->validReferral())
            ->assertSessionHasNoErrors();

        $document = Document::first();

        $this->assertNull($document->transaction_type);
        $this->assertNull($document->description);
    }

    public function test_every_required_field_is_enforced(): void
    {
        $this->actingAs($this->clerk, 'employee')
            ->post(route('documents.store'), [])
            ->assertSessionHasErrors([
                'document_date',
                'taxpayer_name',
                'concern',
                'referred_for',
                'destination_section_id',
                'addressee',
            ]);

        $this->assertSame(0, Document::count());
    }

    public function test_dropdown_values_must_come_from_the_configured_lists(): void
    {
        $this->actingAs($this->clerk, 'employee')
            ->post(route('documents.store'), $this->validReferral([
                'concern' => 'Something made up',
                'referred_for' => 'Whenever',
                'addressee' => 'Anyone',
            ]))
            ->assertSessionHasErrors(['concern', 'referred_for', 'addressee']);
    }

    public function test_every_configured_option_is_accepted(): void
    {
        foreach (config('referral.concerns') as $concern) {
            foreach (config('referral.addressees') as $addressee) {
                $this->actingAs($this->clerk, 'employee')
                    ->post(route('documents.store'), $this->validReferral([
                        'concern' => $concern,
                        'addressee' => $addressee,
                    ]))
                    ->assertSessionHasNoErrors();
            }
        }

        foreach (config('referral.referred_for') as $for) {
            $this->actingAs($this->clerk, 'employee')
                ->post(route('documents.store'), $this->validReferral(['referred_for' => $for]))
                ->assertSessionHasNoErrors();
        }
    }

    public function test_the_referrals_page_offers_the_dropdown_lists_and_the_sending_section(): void
    {
        $response = $this->actingAs($this->clerk, 'employee')
            ->get(route('documents.create'))
            ->assertOk();

        $props = $response->viewData('page')['props'];

        $this->assertSame(config('referral'), $props['referralOptions']);
        $this->assertSame('1002', $props['fromSection']['section_code']);
        $this->assertSame('Revenue District Office', $props['fromSection']['description']);

        // You cannot refer a document to your own section.
        $offered = collect($props['sections'])->pluck('section_id');
        $this->assertFalse($offered->contains($this->rdo->section_id));
        $this->assertTrue($offered->contains($this->compliance->section_id));
    }

    public function test_the_referral_can_be_found_by_concern_and_remarks(): void
    {
        $this->actingAs($this->clerk, 'employee')
            ->post(route('documents.store'), $this->validReferral([
                'remarks' => 'Awaiting signature of the Assistant Chief.',
            ]));

        foreach (['promissory', 'assistant chief', 'approval', '1002'] as $keyword) {
            $response = $this->actingAs($this->clerk, 'employee')
                ->get(route('documents.create', ['search' => $keyword]));

            $this->assertCount(
                1,
                $response->viewData('page')['props']['documents']['data'],
                "Expected a match for [{$keyword}]."
            );
        }
    }
}
