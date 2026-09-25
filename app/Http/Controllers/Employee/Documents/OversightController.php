<?php

namespace App\Http\Controllers\Employee\Documents;

use App\Http\Controllers\Controller;
use App\Models\Document;
use App\Models\DocumentComment;
use App\Services\DocumentService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

/**
 * The RDO's two oversight screens.
 *
 * Most transactions start and end at the RDO, so it is the office that
 * notices when a document has stopped moving somewhere else, and the
 * one that keeps the archive. Both screens are limited to the sections
 * named in config('referral.oversight_sections').
 */
class OversightController extends Controller
{
    /**
     * Documents sitting with other sections, and the notes sent about
     * them.
     *
     * Ordered by how long each has been waiting, so whatever has been
     * stuck longest is the first thing on the screen.
     */
    public function comments(
        Request $request,
        DocumentService $documentService
    ): Response {
        $employee = $this->authorised();

        $stuck = Document::query()
            ->with([
                'status',
                'currentSection',
                'destinationSection',
                'creator.section',
                'latestTrackingHistory',
                'comments.author',
                'comments.toSection',
            ])
            /*
            * Still moving - not completed, not archived - and in
            * someone else's hands.
            */
            ->whereIn('status_id', [1, 2])
            ->where('current_section_id', '!=', $employee->section_id)
            ->latest('created_at')
            ->get()
            /*
            * Longest wait first. Sorting here rather than in SQL
            * because the wait is computed from the last movement.
            */
            ->sortByDesc(fn (Document $document) => $document->aging['hours'] ?? 0)
            ->values();

        return Inertia::render('Employees/Oversight/Comments', [
            'stuck' => $stuck,

            'sent' => DocumentComment::query()
                ->with(['document:document_id,tracking_number,taxpayer_name', 'toSection', 'acknowledgedBy'])
                ->where('author_id', $employee->employee_id)
                ->latest('created_at')
                ->limit(20)
                ->get(),
        ]);
    }

    /**
     * Leave a note on a document held by another section.
     */
    public function storeComment(
        Request $request,
        Document $document
    ): RedirectResponse {
        $employee = $this->authorised();

        $validated = $request->validate([
            'body' => ['required', 'string', 'max:1000'],
        ], [
            'body.required' => 'Please write the message first.',
            'body.max' => 'A comment may not exceed 1000 characters.',
        ]);

        DocumentComment::create([
            'document_id' => $document->document_id,
            'author_id' => $employee->employee_id,

            /*
            * Addressed to whoever is holding it right now, which is
            * who needs to act.
            */
            'to_section_id' => $document->current_section_id,

            'body' => $validated['body'],
        ]);

        return back()->with('success', 'Comment sent to the holding section.');
    }

    /**
     * The receiving section says it has seen a comment.
     *
     * Not limited to the oversight sections: this is the other half of
     * the conversation.
     */
    public function acknowledgeComment(DocumentComment $comment): RedirectResponse
    {
        $employee = Auth::guard('employee')->user();

        abort_unless(
            (int) $comment->to_section_id === (int) $employee->section_id,
            403,
            'That comment was addressed to another section.'
        );

        if (! $comment->acknowledged_at) {
            $comment->update([
                'acknowledged_at' => now(),
                'acknowledged_by' => $employee->employee_id,
            ]);
        }

        return back()->with('success', 'Comment acknowledged.');
    }

    /**
     * The archive: documents closed out because the taxpayer went
     * unresponsive. status_id 4 is Archived.
     */
    public function archive(
        Request $request,
        DocumentService $documentService
    ): Response {
        $employee = $this->authorised();

        $search = $request->string('search')->toString();

        return Inertia::render('Employees/Oversight/Archive', [
            'documents' => $documentService->getArchivedDocuments(
                $employee,
                $search
            ),

            'filters' => [
                'search' => $search,
            ],
        ]);
    }

    /**
     * Both screens belong to the RDO.
     */
    protected function authorised()
    {
        $employee = Auth::guard('employee')->user();

        abort_unless(
            in_array(
                $employee->section?->section_name,
                config('referral.oversight_sections', ['RDO']),
                true
            ),
            403,
            'This screen belongs to the RDO.'
        );

        return $employee;
    }
}
