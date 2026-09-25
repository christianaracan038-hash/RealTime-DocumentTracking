<?php

namespace Tests\Feature\Documents;

use App\Models\Document;
use App\Models\DocumentComment;
use App\Models\DocumentStatus;
use App\Models\EmployeeAcc;
use App\Models\Role;
use App\Models\Section;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * The RDO's oversight screens: the comments it leaves on documents
 * stuck with other sections, and the archive.
 *
 * Most transactions start and end at the RDO, so it is the only office
 * that sees these. Everyone else gets a 403 - including by typing the
 * address in, not merely by not having the sidebar entry.
 */
class OversightTest extends TestCase
{
    use RefreshDatabase;

    protected Section $rdo;

    protected Section $assessment;

    protected EmployeeAcc $chief;

    protected EmployeeAcc $assessor;

    protected function setUp(): void
    {
        parent::setUp();

        DocumentStatus::create(['status_name' => 'Pending', 'status_color' => 'yellow', 'sort_order' => 1]);
        DocumentStatus::create(['status_name' => 'Received', 'status_color' => 'green', 'sort_order' => 2]);
        DocumentStatus::create(['status_name' => 'Completed', 'status_color' => 'blue', 'sort_order' => 3]);
        DocumentStatus::create(['status_name' => 'Archived', 'status_color' => 'gray', 'sort_order' => 4]);

        $this->rdo = Section::create(['section_code' => '1002', 'section_name' => 'RDO', 'is_active' => true]);
        $this->assessment = Section::create(['section_code' => '1001', 'section_name' => 'ASSESSMENT', 'is_active' => true]);

        $role = Role::create(['role_name' => 'Staff', 'is_active' => true]);

        $this->chief = EmployeeAcc::create([
            'username' => 'rdo.staff',
            'password' => 'password',
            'section_id' => $this->rdo->section_id,
            'role_id' => $role->role_id,
            'is_active' => true,
        ]);

        $this->assessor = EmployeeAcc::create([
            'username' => 'assessment.staff',
            'password' => 'password',
            'section_id' => $this->assessment->section_id,
            'role_id' => $role->role_id,
            'is_active' => true,
        ]);
    }

    /**
     * A document registered by the RDO, by default sitting with
     * Assessment.
     */
    protected function makeDocument(int $statusId = 1, ?Section $holder = null): Document
    {
        $holder ??= $this->assessment;

        return Document::create([
            'tracking_number' => 'DOC-20260925-'.str_pad((string) (Document::count() + 1), 6, '0', STR_PAD_LEFT),
            'qr_value' => 'QR-'.uniqid(),
            'document_date' => '2026-09-25',
            'taxpayer_name' => 'Juan Dela Cruz',
            'concern' => 'Tax Assumption',
            'referred_for' => 'Approval',
            'remarks' => 'Processing',
            'status_id' => $statusId,
            'current_section_id' => $holder->section_id,
            'destination_section_id' => $holder->section_id,
            'addressee' => 'Chief',
            'created_by' => $this->chief->employee_id,
            'details_completed_at' => now(),
            'details_completed_by' => $this->chief->employee_id,
        ]);
    }

    protected function makeComment(): DocumentComment
    {
        $document = $this->makeDocument();

        return DocumentComment::create([
            'document_id' => $document->document_id,
            'author_id' => $this->chief->employee_id,
            'to_section_id' => $this->assessment->section_id,
            'body' => 'Please tell us what is holding this.',
        ]);
    }

    public function test_the_rdo_sees_documents_held_by_other_sections(): void
    {
        $elsewhere = $this->makeDocument();
        $atHome = $this->makeDocument(1, $this->rdo);

        $page = $this->actingAs($this->chief, 'employee')
            ->get(route('comments.index'))
            ->assertOk()
            ->viewData('page');

        $stuck = collect($page['props']['stuck'])->pluck('document_id');

        $this->assertTrue($stuck->contains($elsewhere->document_id));

        // Nothing on its own desk: the RDO can already see that.
        $this->assertFalse($stuck->contains($atHome->document_id));
    }

    public function test_a_finished_document_is_not_chased(): void
    {
        $completed = $this->makeDocument(3);
        $archived = $this->makeDocument(4);

        $page = $this->actingAs($this->chief, 'employee')
            ->get(route('comments.index'))
            ->assertOk()
            ->viewData('page');

        $stuck = collect($page['props']['stuck'])->pluck('document_id');

        $this->assertFalse($stuck->contains($completed->document_id));
        $this->assertFalse($stuck->contains($archived->document_id));
    }

    public function test_another_section_cannot_open_the_oversight_screens(): void
    {
        $this->actingAs($this->assessor, 'employee');

        $this->get(route('comments.index'))->assertForbidden();
        $this->get(route('archive.index'))->assertForbidden();
    }

    public function test_a_comment_is_addressed_to_whoever_is_holding_the_document(): void
    {
        $document = $this->makeDocument();

        $this->actingAs($this->chief, 'employee')
            ->post(route('comments.store', $document), [
                'body' => 'This has been with you five days. Please forward it or tell us what is holding it.',
            ])
            ->assertRedirect();

        $comment = DocumentComment::first();

        $this->assertSame($this->assessment->section_id, $comment->to_section_id);
        $this->assertSame($this->chief->employee_id, $comment->author_id);
        $this->assertNull($comment->acknowledged_at);
    }

    public function test_a_comment_needs_a_body(): void
    {
        $document = $this->makeDocument();

        $this->actingAs($this->chief, 'employee')
            ->post(route('comments.store', $document), ['body' => ''])
            ->assertSessionHasErrors('body');

        $this->assertSame(0, DocumentComment::count());
    }

    public function test_only_the_rdo_may_comment(): void
    {
        $document = $this->makeDocument();

        $this->actingAs($this->assessor, 'employee')
            ->post(route('comments.store', $document), ['body' => 'Not my place to say.'])
            ->assertForbidden();

        $this->assertSame(0, DocumentComment::count());
    }

    public function test_the_addressed_section_acknowledges_a_comment(): void
    {
        $comment = $this->makeComment();

        $this->actingAs($this->assessor, 'employee')
            ->patch(route('comments.acknowledge', $comment))
            ->assertRedirect();

        $comment->refresh();

        $this->assertNotNull($comment->acknowledged_at);
        $this->assertSame($this->assessor->employee_id, $comment->acknowledged_by);
    }

    public function test_a_section_cannot_acknowledge_a_comment_addressed_elsewhere(): void
    {
        $comment = $this->makeComment();

        // The RDO wrote it; it is not the RDO's to mark as read.
        $this->actingAs($this->chief, 'employee')
            ->patch(route('comments.acknowledge', $comment))
            ->assertForbidden();

        $this->assertNull($comment->fresh()->acknowledged_at);
    }

    public function test_acknowledging_twice_keeps_the_first_time(): void
    {
        $comment = $this->makeComment();

        $this->actingAs($this->assessor, 'employee')
            ->patch(route('comments.acknowledge', $comment));

        $first = $comment->fresh()->acknowledged_at;

        $this->travel(5)->minutes();

        $this->actingAs($this->assessor, 'employee')
            ->patch(route('comments.acknowledge', $comment));

        $this->assertEquals($first, $comment->fresh()->acknowledged_at);
    }

    public function test_the_archive_lists_only_archived_documents(): void
    {
        $archived = $this->makeDocument(4, $this->rdo);
        $pending = $this->makeDocument(1, $this->rdo);

        $page = $this->actingAs($this->chief, 'employee')
            ->get(route('archive.index'))
            ->assertOk()
            ->viewData('page');

        $listed = collect($page['props']['documents']['data'])->pluck('document_id');

        $this->assertTrue($listed->contains($archived->document_id));
        $this->assertFalse($listed->contains($pending->document_id));
    }
}
