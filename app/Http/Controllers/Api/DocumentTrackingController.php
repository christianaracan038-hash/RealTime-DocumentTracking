<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Document;
use App\Models\TrackingHistory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class DocumentTrackingController extends Controller
{
    /**
     * Scan a document QR code.
     *
     * This only validates the QR and determines
     * whether the logged-in employee is allowed
     * to receive the document.
     */
    public function scan(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'qr_value' => ['required', 'string', 'max:255'],
        ]);

        $employee = Auth::guard('employee')->user();

        $document = Document::query()
            ->with([
                'status',
                'currentSection',
                'destinationSection',
            ])
            ->where('qr_value', $validated['qr_value'])
            ->first();

        if (!$document) {
            return response()->json([
                'message' => 'Document not found.',
            ], 404);
        }

        if (
            (int) $employee->section_id !==
            (int) $document->destination_section_id
        ) {
            return response()->json([
                'message' => 'You are not authorized to receive this document.',
            ], 403);
        }

        if ((int) $document->status_id !== 1) {
            return response()->json([
                'message' => 'This document has already been received.',
                'status' => $document->status?->status_name,
            ], 409);
        }

        return response()->json([
            'success' => true,
            'message' => 'Document can be received.',
            'document' => $document,
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

            /**
             * Lock the document to prevent
             * simultaneous receive requests.
             */
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

            /**
             * Only the destination section
             * can receive the document.
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

            /**
             * Prevent duplicate receiving.
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

            /**
             * Update document.
             */
            $document->update([
                'current_section_id' => $toSectionId,
                'current_employee_id' => $employee->employee_id,
                'status_id' => 2,
                'received_at' => now(),
            ]);

            /**
             * Record tracking history.
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
                ]),
            ];
        });

        return response()->json(
            $result,
            $result['status']
        );
    }
}