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
            'concerns' => ['Promissory Note'],
            'referred_for' => ['Approval'],
            'remarks' => 'Processing',
            'destination_section_id' => $this->compliance->section_id,
            'addressee' => 'Chief',
        ], $overrides);
    }

    public function test_a_clerk_can_register_a_referral(): void
    {
        $this->actingAs($this->clerk, 'employee')
            ->from(route('rdo.dashboard'))
            ->post(route('documents.store'), $this->validReferral())
            ->assertRedirect(route('rdo.dashboard'))
            ->assertSessionHas('success');

        $document = Document::first();

        $this->assertNotNull($document);

        // What the clerk typed.
        $this->assertSame('Juan Dela Cruz', $document->taxpayer_name);
        $this->assertSame('Promissory Note', $document->concern);
        $this->assertSame('Approval', $document->referred_for);
        $this->assertSame('Processing', $document->remarks);
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

    public function test_remarks_are_required(): void
    {
        $this->actingAs($this->clerk, 'employee')
            ->post(route('documents.store'), $this->validReferral(['remarks' => '']))
            ->assertSessionHasErrors('remarks');
    }

    public function test_several_ticks_are_joined_into_one_line(): void
    {
        $this->actingAs($this->clerk, 'employee')
            ->post(route('documents.store'), $this->validReferral([
                'concerns' => ['Tax Assumption', 'Promissory Note'],
                'referred_for' => ['Approval', 'Signature', 'Necessary Action'],
            ]))
            ->assertSessionHasNoErrors();

        $document = Document::first();

        $this->assertSame('Tax Assumption, Promissory Note', $document->concern);
        $this->assertSame('Approval, Signature, Necessary Action', $document->referred_for);
    }

    public function test_ticking_other_requires_the_text_and_stores_it_in_place(): void
    {
        // Ticking Other without saying what it is.
        $this->actingAs($this->clerk, 'employee')
            ->post(route('documents.store'), $this->validReferral([
                'concerns' => ['Other'],
                'referred_for' => ['Other'],
                'remarks' => 'Other',
            ]))
            ->assertSessionHasErrors(['concern_other', 'referred_for_other', 'remarks_other']);

        $this->assertSame(0, Document::count());

        // Ticking Other and saying what it is.
        $this->actingAs($this->clerk, 'employee')
            ->post(route('documents.store'), $this->validReferral([
                'concerns' => ['Tax Assumption', 'Other'],
                'concern_other' => 'Lost receipt',
                'referred_for' => ['Other'],
                'referred_for_other' => 'Return to taxpayer',
                'remarks' => 'Other',
                'remarks_other' => 'Waiting for the taxpayer to call back.',
            ]))
            ->assertSessionHasNoErrors();

        $document = Document::first();

        $this->assertSame('Tax Assumption, Lost receipt', $document->concern);
        $this->assertSame('Return to taxpayer', $document->referred_for);
        $this->assertSame('Waiting for the taxpayer to call back.', $document->remarks);
    }

    public function test_the_other_text_is_ignored_when_other_is_not_ticked(): void
    {
        $this->actingAs($this->clerk, 'employee')
            ->post(route('documents.store'), $this->validReferral([
                'concerns' => ['Tax Assumption'],
                'concern_other' => 'Should not appear',
            ]))
            ->assertSessionHasNoErrors();

        $this->assertSame('Tax Assumption', Document::first()->concern);
    }

    public function test_the_old_registration_page_redirects_to_the_dashboard(): void
    {
        $this->actingAs($this->clerk, 'employee')
            ->get(route('documents.create'))
            ->assertRedirect(route('rdo.dashboard'));
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
                'concerns',
                'referred_for',
                'remarks',
                'destination_section_id',
                'addressee',
            ]);

        $this->assertSame(0, Document::count());
    }

    public function test_dropdown_values_must_come_from_the_configured_lists(): void
    {
        $this->actingAs($this->clerk, 'employee')
            ->post(route('documents.store'), $this->validReferral([
                'concerns' => ['Something made up'],
                'referred_for' => ['Whenever'],
                'remarks' => 'Maybe',
                'addressee' => 'Anyone',
            ]))
            ->assertSessionHasErrors(['concerns.0', 'referred_for.0', 'remarks', 'addressee']);
    }

    public function test_every_configured_option_is_accepted(): void
    {
        $other = ['concern_other' => 'x', 'referred_for_other' => 'x', 'remarks_other' => 'x'];

        foreach (config('referral.concerns') as $concern) {
            foreach (config('referral.addressees') as $addressee) {
                $this->actingAs($this->clerk, 'employee')
                    ->post(route('documents.store'), $this->validReferral([
                        'concerns' => [$concern],
                        'addressee' => $addressee,
                    ] + $other))
                    ->assertSessionHasNoErrors();
            }
        }

        foreach (config('referral.referred_for') as $for) {
            $this->actingAs($this->clerk, 'employee')
                ->post(route('documents.store'), $this->validReferral(['referred_for' => [$for]] + $other))
                ->assertSessionHasNoErrors();
        }

        foreach (config('referral.remarks') as $remark) {
            $this->actingAs($this->clerk, 'employee')
                ->post(route('documents.store'), $this->validReferral(['remarks' => $remark] + $other))
                ->assertSessionHasNoErrors();
        }
    }

    public function test_the_dashboard_offers_the_dropdown_lists_and_the_sending_section(): void
    {
        $response = $this->actingAs($this->clerk, 'employee')
            ->get(route('rdo.dashboard'))
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
                'remarks' => 'Other',
                'remarks_other' => 'Awaiting signature of the Assistant Chief.',
            ]));

        foreach (['promissory', 'assistant chief', 'approval', '1002'] as $keyword) {
            $response = $this->actingAs($this->clerk, 'employee')
                ->get(route('rdo.dashboard', ['search' => $keyword]));

            $this->assertCount(
                1,
                $response->viewData('page')['props']['referrals']['data'],
                "Expected a match for [{$keyword}]."
            );
        }
    }
}
