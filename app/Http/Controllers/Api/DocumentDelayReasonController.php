<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Document;
use App\Models\DocumentComment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class DocumentDelayReasonController extends Controller
{
    /**
     * Add or update a delay reason for a document.
     *
     * Only the employee who currently holds the document can add a reason.
     */
    public function store(Request $request, Document $document): JsonResponse
    {
        $employee = Auth::guard('employee')->user();

        $validated = $request->validate([
            'body' => ['required', 'string', 'max:1000'],
        ]);

        /*
         * Ensure the employee is the current holder or in the destination section.
         */
        abort_unless(
            (int) $document->current_employee_id === (int) $employee->employee_id
            || (int) $document->destination_section_id === (int) $employee->section_id,
            403,
            'You are not authorized to add a delay reason for this document.'
        );

        /*
         * Remove any existing delay notice for this document by this author.
         */
        DocumentComment::where('document_id', $document->document_id)
            ->where('author_id', $employee->employee_id)
            ->where('type', DocumentComment::TYPE_DELAY_NOTICE)
            ->delete();

        $comment = DocumentComment::create([
            'document_id' => $document->document_id,
            'author_id' => $employee->employee_id,
            'to_section_id' => $employee->section_id,
            'body' => $validated['body'],
            'type' => DocumentComment::TYPE_DELAY_NOTICE,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Delay reason saved.',
            'comment' => $comment->load('author'),
        ], 201);
    }

    /**
     * Get the delay reason for a document.
     */
    public function show(Document $document): JsonResponse
    {
        $comment = DocumentComment::where('document_id', $document->document_id)
            ->where('type', DocumentComment::TYPE_DELAY_NOTICE)
            ->with('author')
            ->latest('created_at')
            ->first();

        return response()->json([
            'success' => true,
            'delay_reason' => $comment ? [
                'id' => $comment->comment_id,
                'body' => $comment->body,
                'author' => $comment->author?->username,
                'author_name' => $comment->author?->full_name ?? $comment->author?->username,
                'created_at' => $comment->created_at,
                'acknowledged' => $comment->acknowledged_at !== null,
            ] : null,
        ]);
    }

    /**
     * Remove the delay reason (e.g. once the issue is resolved).
     */
    public function destroy(Document $document): JsonResponse
    {
        $employee = Auth::guard('employee')->user();

        DocumentComment::where('document_id', $document->document_id)
            ->where('author_id', $employee->employee_id)
            ->where('type', DocumentComment::TYPE_DELAY_NOTICE)
            ->delete();

        return response()->json([
            'success' => true,
            'message' => 'Delay reason removed.',
        ]);
    }
}