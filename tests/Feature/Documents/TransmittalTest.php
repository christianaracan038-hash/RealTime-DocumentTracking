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
 * The transmittal sheet.
 *
 * The paper that goes with a stack of documents walked to another
 * section, and gets signed on arrival. The system records receipt when
 * somebody scans a QR code; this covers the minute before that, which is
 * the minute the office has always kept a logbook for.
 *
 * The list is never chosen by hand. It is exactly what the system says
 * is on its way to that section - if the paper and the system could
 * disagree, the signature on the paper would mean nothing.
 */
class TransmittalTest extends TestCase
{
    use RefreshDatabase;

    protected Section $css;

    protected Section $admin;

    protected Section $collection;

    protected EmployeeAcc $clerk;

    protected function setUp(): void
    {
        parent::setUp();

        DocumentStatus::create(['status_name' => 'Pending', 'status_color' => 'yellow', 'sort_order' => 1]);
        DocumentStatus::create(['status_name' => 'Received', 'status_color' => 'green', 'sort_order' => 2]);
        DocumentStatus::create(['status_name' => 'Completed', 'status_color' => 'blue', 'sort_order' => 3]);

        $this->css = Section::create(['section_code' => '1006', 'section_name' => 'CSS', 'is_active' => true]);
        $this->admin = Section::create(['section_code' => '1003', 'section_name' => 'ADMIN', 'is_active' => true]);
        $this->collection = Section::create(['section_code' => '1004', 'section_name' => 'COLLECTION', 'is_active' => true]);

        $this->clerk = EmployeeAcc::create([
            'username' => 'css.staff',
            'full_name' => 'Ann Reyes',
            'password' => 'password',
            'section_id' => $this->css->section_id,
            'role_id' => Role::create(['role_name' => 'Staff', 'is_active' => true])->role_id,
            'is_active' => true,
        ]);
    }

    /**
     * A document sitting with CSS, addressed somewhere else.
     */
    protected function document(array $overrides = []): Document
    {
        return Document::create(array_merge([
            'tracking_number' => 'DOC-20260930-'.str_pad((string) (Document::count() + 1), 6, '0', STR_PAD_LEFT),
            'qr_value' => 'QR-'.uniqid(),
            'taxpayer_name' => 'Juan Dela Cruz',
            'document_date' => '2026-09-30',
            'concern' => 'Tax Assumption',
            'status_id' => 1,
            'current_section_id' => $this->css->section_id,
            'destination_section_id' => $this->admin->section_id,
            'created_by' => $this->clerk->employee_id,
            'details_completed_at' => now(),
            'details_completed_by' => $this->clerk->employee_id,
        ], $overrides));
    }

    protected function sheet(array $query = []): array
    {
        return $this->actingAs($this->clerk, 'employee')
            ->get(route('transmittal.index', $query))
            ->assertOk()
            ->viewData('page')['props'];
    }

    public function test_it_lists_what_is_on_its_way_to_that_section(): void
    {
        $going = $this->document();

        $props = $this->sheet(['to' => $this->admin->section_id]);

        $listed = collect($props['documents'])->pluck('document_id');

        $this->assertTrue($listed->contains($going->document_id));
        $this->assertSame('ADMIN', $props['toSection']['section_name']);
        $this->assertSame('CSS', $props['fromSection']['section_name']);
    }

    public function test_a_document_for_another_section_is_not_on_this_sheet(): void
    {
        $this->document();

        $elsewhere = $this->document([
            'destination_section_id' => $this->collection->section_id,
        ]);

        $listed = collect($this->sheet(['to' => $this->admin->section_id])['documents'])
            ->pluck('document_id');

        $this->assertFalse($listed->contains($elsewhere->document_id));
    }

    public function test_a_received_document_drops_off_the_sheet(): void
    {
        $document = $this->document();

        $receiver = EmployeeAcc::create([
            'username' => 'admin.staff', 'password' => 'password',
            'section_id' => $this->admin->section_id,
            'role_id' => Role::first()->role_id, 'is_active' => true,
        ]);

        $this->actingAs($receiver, 'employee')
            ->postJson("/api/documents/{$document->document_id}/receive")
            ->assertOk();

        /*
         * The whole point: a transmittal only ever lists what has not
         * been received. Once they scan it in, the sheet and the system
         * agree that it arrived.
         */
        $listed = collect($this->sheet(['to' => $this->admin->section_id])['documents'])
            ->pluck('document_id');

        $this->assertFalse($listed->contains($document->document_id));
    }

    public function test_a_document_we_are_holding_for_ourselves_is_not_in_transit(): void
    {
        $ours = $this->document([
            'destination_section_id' => $this->css->section_id,
        ]);

        $props = $this->sheet();

        $this->assertFalse(
            collect($props['documents'])->pluck('document_id')->contains($ours->document_id)
        );
    }

    public function test_a_referral_without_a_destination_is_not_in_transit(): void
    {
        /*
         * Registered at the counter and not yet completed - it has no
         * destination, so it is going nowhere and belongs on no sheet.
         */
        $draft = $this->document([
            'destination_section_id' => null,
            'details_completed_at' => null,
        ]);

        $listed = collect($this->sheet()['documents'])->pluck('document_id');

        $this->assertFalse($listed->contains($draft->document_id));
    }

    public function test_the_destinations_carry_their_own_counts(): void
    {
        $this->document();
        $this->document();
        $this->document(['destination_section_id' => $this->collection->section_id]);

        $destinations = collect($this->sheet()['destinations'])->keyBy('section_name');

        $this->assertSame(2, $destinations['ADMIN']['waiting']);
        $this->assertSame(1, $destinations['COLLECTION']['waiting']);
    }

    public function test_it_opens_on_whichever_section_has_the_most_waiting(): void
    {
        $this->document(['destination_section_id' => $this->collection->section_id]);

        $this->document();
        $this->document();

        // Nothing chosen: ADMIN has two, COLLECTION has one.
        $this->assertSame('ADMIN', $this->sheet()['toSection']['section_name']);
    }

    public function test_it_says_who_released_it(): void
    {
        $this->document();

        $this->assertSame('Ann Reyes', $this->sheet()['releasedBy']);
    }

    public function test_an_empty_office_offers_no_destinations(): void
    {
        $props = $this->sheet();

        $this->assertCount(0, $props['destinations']);
        $this->assertCount(0, $props['documents']);
        $this->assertNull($props['toSection']);
    }

    public function test_every_section_has_one(): void
    {
        /*
         * Asked for as an Admin Section thing, but every section hands
         * over to some other one - Collection sends to Admin, the RDO
         * sends everywhere.
         */
        $collector = EmployeeAcc::create([
            'username' => 'collection.staff', 'password' => 'password',
            'section_id' => $this->collection->section_id,
            'role_id' => Role::first()->role_id, 'is_active' => true,
        ]);

        $this->actingAs($collector, 'employee')
            ->get(route('transmittal.index'))
            ->assertOk();
    }

    public function test_a_guest_cannot_see_one(): void
    {
        $this->get(route('transmittal.index'))->assertRedirect(route('login'));
    }
}
