<?php

namespace App\Http\Controllers\Employee\Documents;

use App\Http\Controllers\Controller;
use App\Models\DocumentComment;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

/**
 * The receiving end of a comment.
 *
 * The RDO writes a note about a document that has stopped moving; this
 * is where the section holding it reads that note. Every section has
 * this screen - unlike the oversight screens, which are the RDO's
 * alone - and a comment only ever appears for the section it was
 * addressed to.
 */
class CommentInboxController extends Controller
{
    /**
     * Notes addressed to this section, unanswered ones first.
     *
     * No filter on the document's age: the RDO's side already refuses
     * to create a comment until the document is overdue, and the
     * sidebar badge counts by section and acknowledgement only. Using
     * the same two conditions here keeps the badge and this list in
     * agreement.
     */
    public function index(): Response
    {
        $employee = Auth::guard('employee')->user();

        $comments = DocumentComment::query()
            ->with([
                'author',
                'reader',
                'document:document_id,tracking_number,taxpayer_name,concern,transaction_type,status_id,current_section_id,updated_at',
            ])
            ->where('to_section_id', $employee->section_id)
            ->orderByRaw('acknowledged_at is null desc')
            ->latest('created_at')
            ->paginate(15);

        return Inertia::render('Employees/Comments/Inbox', [
            'comments' => $comments,
        ]);
    }

    /**
     * This section says it has read a note.
     *
     * Acknowledging changes nothing about the document itself - it only
     * tells the RDO the message landed, so it knows whether to chase
     * again or wait.
     */
    public function acknowledge(DocumentComment $comment): RedirectResponse
    {
        $employee = Auth::guard('employee')->user();

        abort_unless(
            (int) $comment->to_section_id === (int) $employee->section_id,
            403,
            'That comment was addressed to another section.'
        );

        // Keep the first acknowledgement; a second press is not news.
        if (! $comment->acknowledged_at) {
            $comment->update([
                'acknowledged_at' => now(),
                'acknowledged_by' => $employee->employee_id,
            ]);
        }

        return back()->with('success', 'Noted. The RDO can see you have read it.');
    }
}