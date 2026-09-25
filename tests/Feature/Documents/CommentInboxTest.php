<?php

namespace Tests\Feature\Documents;

use App\Models\Document;
use App\Models\DocumentComment;
use App\Models\DocumentStatus;
use App\Models\EmployeeAcc;
use App\Models\Role;
use App\Models\Section;
use App\Models\TrackingHistory;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * A comment has to arrive somewhere. This is the section's own inbox -
 * the notes addressed to it, and nobody else's.
 */
class CommentInboxTest extends TestCase
{
    use RefreshDatabase;

    protected Section $rdo;

    protected Section $assessment;

    protected Section $collection;

    protected EmployeeAcc $chief;

    protected EmployeeAcc $assessor;

    protected EmployeeAcc $collector;

    protected function setUp(): void
    {
        parent::setUp();

        DocumentStatus::create(['status_name' => 'Pending', 'status_color' => 'yellow', 'sort_order' => 1]);
        DocumentStatus::create(['status_name' => 'Received', 'status_color' => 'green', 'sort_order' => 2]);
        DocumentStatus::create(['status_name' => 'Completed', 'status_color' => 'blue', 'sort_order' => 3]);
        DocumentStatus::create(['status_name' => 'Archived', 'status_color' => 'gray', 'sort_order' => 4]);

        $this->rdo = Section::create(['section_code' => '1002', 'section_name' => 'RDO', 'is_active' => true]);
        $this->assessment = Section::create(['section_code' => '1001', 'section_name' => 'ASSESSMENT', 'is_active' => true]);
        $this->collection = Section::create(['section_code' => '1004', 'section_name' => 'COLLECTION', 'is_active' => true]);

        $role = Role::create(['role_name' => 'Staff', 'is_active' => true]);

        $this->chief = EmployeeAcc::create([
            'username' => 'rdo.staff', 'password' => 'password',
            'section_id' => $this->rdo->section_id, 'role_id' => $role->role_id, 'is_active' => true,
        ]);

        $this->assessor = EmployeeAcc::create([
            'username' => 'assessment.staff', 'password' => 'password',
            'section_id' => $this->assessment->section_id, 'role_id' => $role->role_id, 'is_active' => true,
        ]);

        $this->collector = EmployeeAcc::create([
            'username' => 'collection.staff', 'password' => 'password',
            'section_id' => $this->collection->section_id, 'role_id' => $role->role_id, 'is_active' => true,
        ]);
    }

    protected function makeDocument(?Section $holder = null, int $statusId = 1): Document
    {
        $holder ??= $this->assessment;

        return Document::create([
            'tracking_number' => 'DOC-20260926-'.str_pad((string) (Document::count() + 1), 6, '0', STR_PAD_LEFT),
            'qr_value' => 'QR-'.uniqid(),
            'document_date' => '2026-09-26',
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

    protected function commentTo(Section $section, ?Document $document = null): DocumentComment
    {
        $document ??= $this->makeDocument($section);

        return DocumentComment::create([
            'document_id' => $document->document_id,
            'author_id' => $this->chief->employee_id,
            'to_section_id' => $section->section_id,
            'body' => 'Please tell us what is holding this.',
        ]);
    }

    public function test_a_section_sees_only_the_notes_addressed_to_it(): void
    {
        $mine = $this->commentTo($this->assessment);
        $theirs = $this->commentTo($this->collection);

        $page = $this->actingAs($this->assessor, 'employee')
            ->get(route('comments.inbox'))
            ->assertOk()
            ->viewData('page');

        $listed = collect($page['props']['comments']['data'])->pluck('comment_id');

        $this->assertTrue($listed->contains($mine->comment_id));
        $this->assertFalse($listed->contains($theirs->comment_id));
    }

    public function test_unread_notes_come_first(): void
    {
        // Read, but newer - it should still sit below the unread one.
        $old = $this->commentTo($this->assessment);
        $old->update(['acknowledged_at' => now(), 'acknowledged_by' => $this->assessor->employee_id]);

        $this->travel(1)->hour();

        $unread = $this->commentTo($this->assessment);

        $page = $this->actingAs($this->assessor, 'employee')
            ->get(route('comments.inbox'))
            ->assertOk()
            ->viewData('page');

        $listed = collect($page['props']['comments']['data'])->pluck('comment_id')->all();

        $this->assertSame($unread->comment_id, $listed[0]);
    }

    public function test_the_sidebar_count_is_this_sections_unread_notes(): void
    {
        $this->commentTo($this->assessment);
        $this->commentTo($this->assessment);
        $this->commentTo($this->collection);

        $read = $this->commentTo($this->assessment);
        $read->update(['acknowledged_at' => now(), 'acknowledged_by' => $this->assessor->employee_id]);

        $page = $this->actingAs($this->assessor, 'employee')
            ->get(route('comments.inbox'))
            ->assertOk()
            ->viewData('page');

        $this->assertSame(2, $page['props']['unreadComments']);
    }

    public function test_reading_a_note_clears_it_from_the_count(): void
    {
        $comment = $this->commentTo($this->assessment);

        $this->actingAs($this->assessor, 'employee')
            ->patch(route('comments.acknowledge', $comment))
            ->assertRedirect();

        $page = $this->actingAs($this->assessor, 'employee')
            ->get(route('comments.inbox'))
            ->assertOk()
            ->viewData('page');

        $this->assertSame(0, $page['props']['unreadComments']);
    }

    public function test_a_section_cannot_read_a_note_sent_to_another_section(): void
    {
        $comment = $this->commentTo($this->collection);

        $this->actingAs($this->assessor, 'employee')
            ->patch(route('comments.acknowledge', $comment))
            ->assertForbidden();

        $this->assertNull($comment->fresh()->acknowledged_at);
    }

    public function test_a_note_follows_the_document_it_was_written_about(): void
    {
        /*
         * Written while Assessment held it. Assessment keeps the note
         * even after the document moves on - it was addressed to them,
         * and it is their answer that is wanted.
         */
        $document = $this->makeDocument($this->assessment, 2);
        $comment = $this->commentTo($this->assessment, $document);

        TrackingHistory::create([
            'document_id' => $document->document_id,
            'from_section_id' => $this->assessment->section_id,
            'to_section_id' => $this->collection->section_id,
            'employee_id' => $this->assessor->employee_id,
            'status_id' => 1,
            'action' => 'FORWARDED',
            'tracked_at' => now(),
        ]);

        $document->update([
            'current_section_id' => $this->collection->section_id,
            'destination_section_id' => $this->collection->section_id,
            'status_id' => 1,
        ]);

        $page = $this->actingAs($this->assessor, 'employee')
            ->get(route('comments.inbox'))
            ->assertOk()
            ->viewData('page');

        $listed = collect($page['props']['comments']['data'])->pluck('comment_id');

        $this->assertTrue($listed->contains($comment->comment_id));

        // And Collection, who never received it, does not.
        $page = $this->actingAs($this->collector, 'employee')
            ->get(route('comments.inbox'))
            ->assertOk()
            ->viewData('page');

        $this->assertCount(0, $page['props']['comments']['data']);
    }
}
