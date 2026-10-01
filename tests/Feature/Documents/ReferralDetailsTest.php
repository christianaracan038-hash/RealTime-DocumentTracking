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
 * What a referral asks for now, and what it no longer asks for.
 *
 * The office cut three things out of the form at once, each for its own
 * reason, and all three are easy to put back by accident:
 *
 *   Addressed to  everything goes to the Chief, so the server writes it.
 *                 If the Chief is away somebody else receives it, and the
 *                 movement trail records who - that is a fact about what
 *                 happened, not a box on a form.
 *   Concerns      the fixed tick list never matched what was on the
 *                 paper. One free-text field now.
 *   Remarks       a block on the printed form, filled in by hand on the
 *                 hardcopy like "FOR" beside it.
 */
class ReferralDetailsTest extends TestCase
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
        DocumentStatus::create(['status_name' => 'Received', 'status_color' => 'green', 'sort_order' => 2]);

        $this->rdo = Section::create([
            'section_code' => '1002', 'section_name' => 'RDO',
            'description' => "RDO's/ARDO's Office", 'is_active' => true,
        ]);

        $this->compliance = Section::create([
            'section_code' => '1005', 'section_name' => 'COMPLIANCE',
            'description' => 'Compliance Section', 'is_active' => true,
        ]);

        $this->clerk = EmployeeAcc::create([
            'username' => 'rdo.staff',
            'full_name' => 'John Dela Cruz',
            'password' => 'password',
            'section_id' => $this->rdo->section_id,
            'role_id' => Role::create(['role_name' => 'Staff', 'is_active' => true])->role_id,
            'is_active' => true,
        ]);
    }

    protected function register(array $overrides = []): Document
    {
        $this->actingAs($this->clerk, 'employee')
            ->post(route('referrals.store'), array_merge([
                'taxpayer_name' => 'Juan Dela Cruz',
                'destination_section_id' => $this->compliance->section_id,
                'concern' => 'Request for installment payment',
            ], $overrides))
            ->assertSessionHasNoErrors();

        return Document::latest('document_id')->first();
    }

    public function test_everything_is_addressed_to_the_chief(): void
    {
        $this->assertSame('Chief', $this->register()->addressee);
    }

    public function test_an_addressee_cannot_be_chosen(): void
    {
        /*
         * Not merely absent from the form - refused by the request, so
         * putting the field back in a page would change nothing on its
         * own.
         */
        $document = $this->register(['addressee' => 'Authorized & Chief']);

        $this->assertSame('Chief', $document->addressee);
    }

    public function test_the_details_are_one_free_text_field(): void
    {
        $document = $this->register([
            'concern' => 'Promissory note, plus two open cases from 2024',
        ]);

        $this->assertSame(
            'Promissory note, plus two open cases from 2024',
            $document->concern
        );
    }

    public function test_the_details_are_required(): void
    {
        $this->actingAs($this->clerk, 'employee')
            ->post(route('referrals.store'), [
                'taxpayer_name' => 'Juan Dela Cruz',
                'destination_section_id' => $this->compliance->section_id,
            ])
            ->assertSessionHasErrors('concern');

        $this->assertSame(0, Document::count());
    }

    public function test_the_old_tick_list_is_not_accepted(): void
    {
        /*
         * A payload in the shape the form used to send. It must not
         * quietly succeed and store the wrong thing - the details field
         * is missing from it, so it is refused.
         */
        $this->actingAs($this->clerk, 'employee')
            ->post(route('referrals.store'), [
                'taxpayer_name' => 'Juan Dela Cruz',
                'destination_section_id' => $this->compliance->section_id,
                'concerns' => ['Tax Assumption'],
                'concern_other' => 'Something else',
            ])
            ->assertSessionHasErrors('concern');
    }

    public function test_remarks_are_never_stored(): void
    {
        $document = $this->register(['remarks' => 'Processing']);

        /*
         * Written by hand on the printed slip. Accepting it here would
         * mean two places disagreeing about the same block.
         */
        $this->assertNull($document->remarks);
    }

    public function test_others_is_a_destination_but_not_a_workplace(): void
    {
        $others = Section::create([
            'section_code' => '1007',
            'section_name' => 'OTHERS',
            'description' => 'Others (outside the District)',
            'is_active' => true,
        ]);

        $document = $this->register(['destination_section_id' => $others->section_id]);

        $this->assertSame($others->section_id, $document->destination_section_id);

        /*
         * Deliberately absent from config/section.php, so it has no
         * dashboard and nobody can sign in there - it is somewhere
         * documents go, not somewhere anybody works.
         */
        $this->assertArrayNotHasKey('OTHERS', config('section'));
    }

    public function test_the_admin_section_is_named_administrative_section(): void
    {
        $admin = Section::create([
            'section_code' => '1006',
            'section_name' => 'ADMIN',
            'description' => 'Administrative Section',
            'is_active' => true,
        ]);

        /*
         * section_name stays ADMIN because config/section.php, the
         * dashboard route and the sidebar are all keyed on it. The
         * description is what the forms and the printed slip show.
         */
        $this->assertSame('Administrative Section', $admin->description);
        $this->assertArrayHasKey('ADMIN', config('section'));
    }
}
