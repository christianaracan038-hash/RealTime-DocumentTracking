<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Document;
use App\Models\TrackingHistory;
use App\Models\Section;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class DocumentTrackingController extends Controller
{
    /**
     * Scan a document QR code.
     *
     * RECEIVE:
     * - QR must belong to destination section
     * - Document must still be Pending
     *
     * FORWARD:
     * - QR must belong to current employee/section
     * - Document must already be Received
     * - Return available destination sections
     */
    public function scan(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'qr_value' => ['required', 'string', 'max:255'],
            'mode' => ['nullable', 'in:receive,forward'],
        ]);

        $employee = Auth::guard('employee')->user();

        $mode = $validated['mode'] ?? 'receive';

        $document = Document::query()
            ->with([
                'status',
                'currentSection',
                'destinationSection',
                'currentEmployee',
            ])
            ->where('qr_value', $validated['qr_value'])
            ->first();

        if (!$document) {
            return response()->json([
                'message' => 'Document not found.',
            ], 404);
        }

        /*
        |--------------------------------------------------------------------------
        | RECEIVE MODE
        |--------------------------------------------------------------------------
        */
        if ($mode === 'receive') {

            // Only destination section can receive.
            if (
                (int) $employee->section_id !==
                (int) $document->destination_section_id
            ) {
                return response()->json([
                    'message' =>
                        'You are not authorized to receive this document.',
                ], 403);
            }

            // Pending = status_id 1
            if ((int) $document->status_id !== 1) {
                return response()->json([
                    'message' =>
                        'This document has already been received.',
                    'status' => $document->status?->status_name,
                ], 409);
            }

            return response()->json([
                'success' => true,
                'message' => 'Document can be received.',
                'mode' => 'receive',
                'document' => $document,
            ]);
        }

        /*
        |--------------------------------------------------------------------------
        | FORWARD MODE
        |--------------------------------------------------------------------------
        */

        // Forwarding is only allowed if document is already received.
        if ((int) $document->status_id !== 2) {
            return response()->json([
                'message' =>
                    'This document must be received before it can be forwarded.',
                'status' => $document->status?->status_name,
            ], 409);
        }

        /*
        |--------------------------------------------------------------------------
        | Make sure the logged-in employee currently has the document.
        |--------------------------------------------------------------------------
        */

        if (
            (int) $document->current_employee_id !==
            (int) $employee->employee_id
        ) {
            return response()->json([
                'message' =>
                    'This document is not currently assigned to you.',
            ], 403);
        }

        /*
        |--------------------------------------------------------------------------
        | Get sections available for forwarding.
        |
        | Exclude:
        | - employee's current section
        |--------------------------------------------------------------------------
        */

        $sections = Section::query()
            ->where('section_id', '!=', $employee->section_id)
            ->orderBy('section_name')
            ->get([
                'section_id',
                'section_name',
            ]);

        return response()->json([
            'success' => true,
            'message' => 'Document verified for forwarding.',
            'mode' => 'forward',
            'document' => $document,
            'sections' => $sections,
        ]);
    }

    /**
     * Receive a document.
     */
    public function receive(
        Request $request,
        Document $document
    ): JsonResponse {
        $employee = Auth::guard('employee')->user();

        $result = DB::transaction(function () use (
            $document,
            $employee
        ) {

            $document = Document::query()
                ->lockForUpdate()
                ->with([
                    'status',
                    'currentSection',
                    'destinationSection',
                ])
                ->find($document->document_id);

            if (!$document) {
                return [
                    'success' => false,
                    'status' => 404,
                    'message' => 'Document not found.',
                ];
            }

            /*
            |--------------------------------------------------------------------------
            | Only destination section can receive.
            |--------------------------------------------------------------------------
            */

            if (
                (int) $employee->section_id !==
                (int) $document->destination_section_id
            ) {
                return [
                    'success' => false,
                    'status' => 403,
                    'message' =>
                        'You are not authorized to receive this document.',
                ];
            }

            /*
            |--------------------------------------------------------------------------
            | Prevent duplicate receiving.
            |--------------------------------------------------------------------------
            */

            if ((int) $document->status_id !== 1) {
                return [
                    'success' => false,
                    'status' => 409,
                    'message' =>
                        'This document has already been received.',
                ];
            }

            $fromSectionId = $document->current_section_id;
            $toSectionId = $document->destination_section_id;

            /*
            |--------------------------------------------------------------------------
            | Update document.
            |--------------------------------------------------------------------------
            */

            $document->update([
                'current_section_id' => $toSectionId,
                'current_employee_id' => $employee->employee_id,
                'status_id' => 2,
                'received_at' => now(),
            ]);

            /*
            |--------------------------------------------------------------------------
            | Record tracking history.
            |--------------------------------------------------------------------------
            */

            TrackingHistory::create([
                'document_id' => $document->document_id,
                'from_section_id' => $fromSectionId,
                'to_section_id' => $toSectionId,
                'employee_id' => $employee->employee_id,
                'status_id' => 2,
                'action' => 'RECEIVED',
                'remarks' => 'Document received by destination section.',
                'tracked_at' => now(),
            ]);

            return [
                'success' => true,
                'status' => 200,
                'message' => 'Document received successfully.',
                'document' => $document->fresh([
                    'status',
                    'currentSection',
                    'destinationSection',
                    'currentEmployee',
                ]),
            ];
        });

        return response()->json(
            $result,
            $result['status']
        );
    }

    /**
     * Forward a received document to another section.
     */
    public function forward(
        Request $request,
        Document $document
    ): JsonResponse {
        $validated = $request->validate([
            'destination_section_id' => [
                'required',
                'integer',
                'exists:sections,section_id',
            ],
        ]);

        $employee = Auth::guard('employee')->user();

        $result = DB::transaction(function () use (
            $document,
            $employee,
            $validated
        ) {

            /*
            |--------------------------------------------------------------------------
            | Lock document.
            |--------------------------------------------------------------------------
            */

            $document = Document::query()
                ->lockForUpdate()
                ->with([
                    'status',
                    'currentSection',
                    'destinationSection',
                    'currentEmployee',
                ])
                ->find($document->document_id);

            if (!$document) {
                return [
                    'success' => false,
                    'status' => 404,
                    'message' => 'Document not found.',
                ];
            }

            /*
            |--------------------------------------------------------------------------
            | Document must be Received.
            |--------------------------------------------------------------------------
            */

            if ((int) $document->status_id !== 2) {
                return [
                    'success' => false,
                    'status' => 409,
                    'message' =>
                        'Only received documents can be forwarded.',
                ];
            }

            /*
            |--------------------------------------------------------------------------
            | Make sure current employee owns the document.
            |--------------------------------------------------------------------------
            */

            if (
                (int) $document->current_employee_id !==
                (int) $employee->employee_id
            ) {
                return [
                    'success' => false,
                    'status' => 403,
                    'message' =>
                        'This document is not currently assigned to you.',
                ];
            }

            $fromSectionId = $document->current_section_id;
            $toSectionId = (int) $validated['destination_section_id'];

            /*
            |--------------------------------------------------------------------------
            | Cannot forward to same section.
            |--------------------------------------------------------------------------
            */

            if ($fromSectionId === $toSectionId) {
                return [
                    'success' => false,
                    'status' => 422,
                    'message' =>
                        'You cannot forward the document to the same section.',
                ];
            }

            /*
            |--------------------------------------------------------------------------
            | Get destination section.
            |--------------------------------------------------------------------------
            */

            $destinationSection = Section::find($toSectionId);

            if (!$destinationSection) {
                return [
                    'success' => false,
                    'status' => 404,
                    'message' => 'Destination section not found.',
                ];
            }

            /*
            |--------------------------------------------------------------------------
            | Update document.
            |
            | Important:
            | status goes back to Pending (1)
            | because the new destination has not received it yet.
            |--------------------------------------------------------------------------
            */

            $document->update([
                'current_section_id' => $fromSectionId,
                'current_employee_id' => $employee->employee_id,
                'destination_section_id' => $toSectionId,
                'status_id' => 1,
                'received_at' => null,
            ]);

            /*
            |--------------------------------------------------------------------------
            | Record tracking history.
            |--------------------------------------------------------------------------
            */

            TrackingHistory::create([
                'document_id' => $document->document_id,
                'from_section_id' => $fromSectionId,
                'to_section_id' => $toSectionId,
                'employee_id' => $employee->employee_id,
                'status_id' => 1,
                'action' => 'FORWARDED',
                'remarks' =>
                    'Document forwarded to ' .
                    $destinationSection->section_name . '.',
                'tracked_at' => now(),
            ]);

            return [
                'success' => true,
                'status' => 200,
                'message' => 'Document forwarded successfully.',
                'document' => $document->fresh([
                    'status',
                    'currentSection',
                    'destinationSection',
                    'currentEmployee',
                ]),
            ];
        });

        return response()->json(
            $result,
            $result['status']
        );
    }
}