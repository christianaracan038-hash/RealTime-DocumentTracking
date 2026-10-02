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
 * A section's own referral - everything except the RDO.
 *
 * Not BIR Form 2309. That form is a taxpayer's referral; this is an
 * internal docket moving between sections, and what the office wants
 * from the paper is two signatures - who handed it over, who took it.
 *
 * So there is no taxpayer, no step 2, and the two forms deliberately
 * cannot issue each other's paper.
 */
class SectionReferralTest extends TestCase
{
    use RefreshDatabase;

    protected Section $assessment;

    protected Section $admin;

    protected Section $rdo;

    protected EmployeeAcc $assessor;

    protected EmployeeAcc $rdoClerk;

    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake('public');

        DocumentStatus::create(['status_name' => 'Pending', 'status_color' => 'yellow', 'sort_order' => 1]);
        DocumentStatus::create(['status_name' => 'Received', 'status_color' => 'green', 'sort_order' => 2]);

        $this->rdo = Section::create([
            'section_code' => '1002', 'section_name' => 'RDO',
            'description' => "RDO's/ARDO's Office", 'is_active' => true,
        ]);

        $this->assessment = Section::create([
            'section_code' => '1001', 'section_name' => 'ASSESSMENT',
            'description' => 'Assessment Section', 'is_active' => true,
        ]);

        $this->admin = Section::create([
            'section_code' => '1006', 'section_name' => 'ADMIN',
            'description' => 'Administrative Section', 'is_active' => true,
        ]);

        $role = Role::create(['role_name' => 'Staff', 'is_active' => true]);

        $this->assessor = EmployeeAcc::create([
            'username' => 'assessment.staff',
            'full_name' => 'Ann Reyes',
            'password' => 'password',
            'section_id' => $this->assessment->section_id,
            'role_id' => $role->role_id,
            'is_active' => true,
        ]);

        $this->rdoClerk = EmployeeAcc::create([
            'username' => 'rdo.staff', 'password' => 'password',
            'section_id' => $this->rdo->section_id,
            'role_id' => $role->role_id, 'is_active' => true,
        ]);
    }

    protected function register(array $overrides = [])
    {
        return $this->actingAs($this->assessor, 'employee')
            ->post(route('referrals.section.store'), array_merge([
                'destination_section_id' => $this->admin->section_id,
                'concern' => 'Docket for signature of the Chief',
            ], $overrides));
    }

    public function test_it_asks_for_a_destination_and_the_details_only(): void
    {
        $this->register()->assertSessionHasNoErrors();

        $document = Document::first();

        $this->assertSame('Docket for signature of the Chief', $document->concern);
        $this->assertSame($this->admin->section_id, $document->destination_section_id);

        // An internal docket has no taxpayer.
        $this->assertNull($document->taxpayer_name);
    }

    public function test_it_is_finished_the_moment_it_is_saved(): void
    {
        $this->register();

        $document = Document::first();

        /*
         * There is no step 2 - the one form is the whole referral - so it
         * must never appear as outstanding work on anybody's list.
         */
        $this->assertNotNull($document->details_completed_at);
        $this->assertFalse($document->awaiting_details);

        // And it can be routed straight away.
        $this->assertSame(1, (int) $document->status_id);
        $this->assertNotNull($document->qr_value);
        Storage::disk('public')->assertExists('qrcodes/'.$document->qr_value.'.svg');
    }

    public function test_the_section_preparing_it_is_taken_from_the_account(): void
    {
        $this->register();

        $document = Document::first();

        /*
         * Never asked for. The slip's "Prepared:" line names this, and a
         * field would only let somebody answer wrong.
         */
        $this->assertSame($this->assessor->employee_id, (int) $document->created_by);
        $this->assertSame($this->assessment->section_id, $document->current_section_id);
        $this->assertSame('1001', $document->office_code);
    }

    public function test_the_date_is_stamped_not_asked_for(): void
    {
        $this->travelTo('2026-10-01 09:30:00');

        $this->register(['document_date' => '2026-01-05'])->assertSessionHasNoErrors();

        $this->assertSame(
            '2026-10-01',
            Document::first()->document_date->toDateString()
        );
    }

    public function test_a_referral_cannot_be_sent_to_our_own_section(): void
    {
        /*
         * A slip whose Prepared and Received lines name the same section
         * records nothing at all.
         */
        $this->register(['destination_section_id' => $this->assessment->section_id])
            ->assertSessionHasErrors('destination_section_id');

        $this->assertSame(0, Document::count());
    }

    public function test_both_fields_are_required(): void
    {
        $this->actingAs($this->assessor, 'employee')
            ->post(route('referrals.section.store'), [])
            ->assertSessionHasErrors(['destination_section_id', 'concern']);

        $this->assertSame(0, Document::count());
    }

    public function test_the_rdo_cannot_issue_this_slip(): void
    {
        /*
         * The RDO issues BIR Form 2309 through referrals.store. Letting
         * it through here would produce the wrong piece of paper for a
         * taxpayer's referral.
         */
        $this->actingAs($this->rdoClerk, 'employee')
            ->post(route('referrals.section.store'), [
                'destination_section_id' => $this->admin->section_id,
                'concern' => 'Something',
            ])
            ->assertForbidden();

        $this->assertSame(0, Document::count());
    }

    public function test_the_page_says_which_form_each_section_issues(): void
    {
        $props = $this->actingAs($this->assessor, 'employee')
            ->get(route('referrals.index'))
            ->assertOk()
            ->viewData('page')['props'];

        $this->assertFalse($props['usesForm2309']);

        $props = $this->actingAs($this->rdoClerk, 'employee')
            ->get(route('referrals.index'))
            ->assertOk()
            ->viewData('page')['props'];

        $this->assertTrue($props['usesForm2309']);
    }

    public function test_it_lands_on_the_register_with_its_slip_open(): void
    {
        $response = $this->register();

        $document = Document::first();

        $response->assertRedirect(
            route('referrals.index', ['slip' => $document->document_id])
        );
    }

    public function test_the_slip_can_be_built_from_the_detail_endpoint(): void
    {
        $this->register();

        $document = Document::first();

        /*
         * The slip needs the preparing section and the receiving one for
         * its two bottom cells, and the details for its first - all from
         * here, since a register row is too light to print from.
         */
        $body = $this->actingAs($this->assessor, 'employee')
            ->getJson(route('documents.detail', $document))
            ->assertOk()
            ->json('document');

        $this->assertSame('Docket for signature of the Chief', $body['concern']);
        $this->assertSame('ASSESSMENT', $body['creator']['section']['section_name']);
        $this->assertSame('ADMIN', $body['destination_section']['section_name']);
    }

    public function test_a_guest_cannot_register_one(): void
    {
        $this->post(route('referrals.section.store'), [
            'destination_section_id' => $this->admin->section_id,
            'concern' => 'Something',
        ])->assertRedirect(route('login'));

        $this->assertSame(0, Document::count());
    }
}
