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
 * The section's register of referrals.
 *
 * Answers the question the office asked: where does a referral go once
 * its details are done? It stays here, with its slip. Before this it
 * vanished from the Referrals page the moment step 2 finished, and the
 * only way back to its slip was to hunt through History.
 *
 * Scoped by who registered it rather than who is holding it, because a
 * completed referral is in somebody else's hands and still belongs in the
 * register of slips this office issued.
 */
class ReferralRegisterTest extends TestCase
{
    use RefreshDatabase;

    protected Section $rdo;

    protected Section $compliance;

    protected EmployeeAcc $clerk;

    protected EmployeeAcc $outsider;

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

        $this->outsider = EmployeeAcc::create([
            'username' => 'compliance.staff', 'password' => 'password',
            'section_id' => $this->compliance->section_id, 'role_id' => $role->role_id, 'is_active' => true,
        ]);
    }

    protected function register(string $taxpayer = 'Juan Dela Cruz'): Document
    {
        $this->actingAs($this->clerk, 'employee')
            ->post(route('documents.store'), [
                'taxpayer_name' => $taxpayer,
                'document_date' => '2026-09-22',
            ])
            ->assertSessionHasNoErrors();

        return Document::latest('document_id')->first();
    }

    protected function completeDetails(Document $document): void
    {
        $this->actingAs($this->clerk, 'employee')
            ->patch(route('documents.complete', $document), [
                'concerns' => ['Tax Assumption'],
                'referred_for' => ['Approval'],
                'remarks' => 'Processing',
                'destination_section_id' => $this->compliance->section_id,
                'addressee' => 'Chief',
            ])
            ->assertSessionHasNoErrors();
    }

    protected function register_page(array $query = []): array
    {
        return $this->actingAs($this->clerk, 'employee')
            ->get(route('referrals.index', $query))
            ->assertOk()
            ->viewData('page')['props'];
    }

    public function test_a_referral_stays_in_the_register_after_step_two(): void
    {
        $document = $this->register();

        $this->completeDetails($document);

        $props = $this->register_page();

        $listed = collect($props['documents']['data'])->pluck('document_id');

        $this->assertTrue(
            $listed->contains($document->document_id),
            'A finished referral keeps its place in the register, with its slip.'
        );

        $this->assertSame(1, $props['counts']['slip']);
        $this->assertSame(0, $props['counts']['waiting']);
    }

    public function test_it_stays_even_after_the_document_has_moved_on(): void
    {
        $document = $this->register();

        $this->completeDetails($document);

        // Compliance receives it, so it is no longer in the RDO's hands.
        $this->actingAs($this->outsider, 'employee')
            ->postJson("/api/documents/{$document->document_id}/receive")
            ->assertOk();

        $listed = collect($this->register_page()['documents']['data'])
            ->pluck('document_id');

        $this->assertTrue($listed->contains($document->document_id));
    }

    public function test_a_row_carries_only_what_is_needed_to_recognise_it(): void
    {
        $document = $this->register();

        $row = collect($this->register_page()['documents']['data'])->first();

        // The taxpayer, the reference number, and when it was registered.
        $this->assertSame($document->taxpayer_name, $row['taxpayer_name']);
        $this->assertSame($document->tracking_number, $row['tracking_number']);
        $this->assertNotNull($row['created_at']);

        // And whether it still needs its details.
        $this->assertNull($row['details_completed_at']);
    }

    public function test_the_tabs_filter_the_register(): void
    {
        $waiting = $this->register('Still Waiting');

        $done = $this->register('All Done');
        $this->completeDetails($done);

        $onlyWaiting = collect($this->register_page(['status' => 'waiting'])['documents']['data'])
            ->pluck('taxpayer_name');

        $this->assertSame(['Still Waiting'], $onlyWaiting->all());

        $onlySlips = collect($this->register_page(['status' => 'slip'])['documents']['data'])
            ->pluck('taxpayer_name');

        $this->assertSame(['All Done'], $onlySlips->all());

        // And the counts behind the tabs.
        $counts = $this->register_page()['counts'];

        $this->assertSame(2, $counts['all']);
        $this->assertSame(1, $counts['waiting']);
        $this->assertSame(1, $counts['slip']);

        $this->assertNotNull($waiting);
    }

    public function test_another_sections_referrals_are_not_in_this_register(): void
    {
        $mine = $this->register('Mine');

        $theirs = Document::create([
            'tracking_number' => 'DOC-20260922-000777',
            'qr_value' => 'DOC-20260922-000777',
            'taxpayer_name' => 'Theirs',
            'document_date' => '2026-09-22',
            'status_id' => 1,
            'current_section_id' => $this->compliance->section_id,
            'created_by' => $this->outsider->employee_id,
        ]);

        $listed = collect($this->register_page()['documents']['data'])->pluck('document_id');

        $this->assertTrue($listed->contains($mine->document_id));
        $this->assertFalse($listed->contains($theirs->document_id));
    }

    public function test_the_register_and_the_form_are_separate_frames(): void
    {
        // The table opens first.
        $this->assertSame('list', $this->register_page()['frame']);

        // And registering is a frame of its own, not a dialog over it.
        $this->assertSame('register', $this->register_page(['frame' => 'register'])['frame']);

        // The dashboard button still arrives with ?new=1.
        $this->assertSame('register', $this->register_page(['new' => 1])['frame']);
    }

    public function test_outstanding_work_is_listed_oldest_first_and_the_rest_newest(): void
    {
        $first = $this->register('First In');

        $this->travel(2)->hours();

        $second = $this->register('Second In');

        $waiting = collect($this->register_page(['status' => 'waiting'])['documents']['data'])
            ->pluck('taxpayer_name');

        $this->assertSame(['First In', 'Second In'], $waiting->all());

        /*
         * The register itself reads newest first, the way a logbook does
         * when you open it to add to it.
         */
        $all = collect($this->register_page()['documents']['data'])->pluck('taxpayer_name');

        $this->assertSame(['Second In', 'First In'], $all->all());

        $this->assertNotNull($first);
        $this->assertNotNull($second);
    }

    public function test_the_trail_is_reachable_from_a_row(): void
    {
        $document = $this->register();

        $this->completeDetails($document);

        TrackingHistory::create([
            'document_id' => $document->document_id,
            'from_section_id' => $this->rdo->section_id,
            'to_section_id' => $this->compliance->section_id,
            'employee_id' => $this->clerk->employee_id,
            'status_id' => 1,
            'action' => 'FORWARDED',
            'tracked_at' => now(),
        ]);

        /*
         * A row is too light to build a reference slip from, so the slip
         * button fetches the document first - this is that endpoint.
         */
        $body = $this->actingAs($this->clerk, 'employee')
            ->getJson(route('documents.detail', $document))
            ->assertOk()
            ->json();

        $this->assertSame('Tax Assumption', $body['document']['concern']);
        $this->assertSame('Chief', $body['document']['addressee']);
        $this->assertCount(1, $body['document']['tracking_histories']);
    }
}
