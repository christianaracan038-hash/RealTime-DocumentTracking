<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Document;
use App\Models\Section;
use App\Models\TrackingHistory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class DocumentTrackingController extends Controller
{
    /**
     * Terminal statuses — nothing can be received or forwarded once a
     * document reaches one of these.
     *
     * 3 = Completed (requested action carried out)
     * 4 = Archived (taxpayer unresponsive, closed out by Admin)
     */
    private const TERMINAL_STATUSES = [3, 4];

    /**
     * A short message for whichever terminal status a document is in,
     * used wherever an action is blocked because of it.
     */
    private function terminalMessage(Document $document): string
    {
        return match ((int) $document->status_id) {
            3 => 'This document has been completed. Nothing more to do.',
            4 => 'This document has been archived. Nothing more to do.',
            default => 'This document can no longer be moved.',
        };
    }

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
                'creator',
            ])
            ->where('qr_value', $validated['qr_value'])
            ->first();

        if (! $document) {
            return response()->json([
                'message' => 'Document not found.',
            ], 404);
        }

        if (in_array((int) $document->status_id, self::TERMINAL_STATUSES, true)) {
            return response()->json([
                'message' => $this->terminalMessage($document),
                'status' => $document->status?->status_name,
            ], 409);
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
                    'message' => 'You are not authorized to receive this document.',
                ], 403);
            }

            // Pending = status_id 1
            if ((int) $document->status_id !== 1) {
                return response()->json([
                    'message' => 'This document has already been received.',
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
                'message' => 'This document must be received before it can be forwarded.',
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
                'message' => 'This document is not currently assigned to you.',
            ], 403);
        }

        /*
        |--------------------------------------------------------------------------
        | Get sections available for forwarding.
        |
        | Documents may travel back and forth freely — e.g. RDO to
        | Assessment and back to RDO — so the only section excluded is
        | the employee's own (a document cannot be "forwarded" to the
        | section that already has it).
        |--------------------------------------------------------------------------
        */

        $sections = Section::query()
            ->whereNotIn('section_id', array_filter([
                $employee->section_id,
            ]))
            ->orderBy('section_name')
            ->get([
                'section_id',
                'section_name',
                'description',
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

            if (! $document) {
                return [
                    'success' => false,
                    'status' => 404,
                    'message' => 'Document not found.',
                ];
            }

            if (in_array((int) $document->status_id, self::TERMINAL_STATUSES, true)) {
                return [
                    'success' => false,
                    'status' => 409,
                    'message' => $this->terminalMessage($document),
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
                    'message' => 'You are not authorized to receive this document.',
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
                    'message' => 'This document has already been received.',
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
     *
     * A forward to Admin may instead archive the document outright
     * (`archive: true`) when the taxpayer has gone unresponsive and
     * there is nowhere further to route it — this closes the document
     * out the same way Completed does, with no further movement.
     * Otherwise, an optional `addressee` (e.g. "Chief", "Authorized &
     * Chief") records who at the destination it is filed to.
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
            'addressee' => [
                'nullable',
                'string',
                'max:100',
            ],
            'archive' => [
                'nullable',
                'boolean',
            ],
        ]);

        $employee = Auth::guard('employee')->user();
        $archiving = (bool) ($validated['archive'] ?? false);

        $result = DB::transaction(function () use (
            $document,
            $employee,
            $validated,
            $archiving
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
                    'creator',
                ])
                ->find($document->document_id);

            if (! $document) {
                return [
                    'success' => false,
                    'status' => 404,
                    'message' => 'Document not found.',
                ];
            }

            if (in_array((int) $document->status_id, self::TERMINAL_STATUSES, true)) {
                return [
                    'success' => false,
                    'status' => 409,
                    'message' => $this->terminalMessage($document),
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
                    'message' => 'Only received documents can be forwarded.',
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
                    'message' => 'This document is not currently assigned to you.',
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
                    'message' => 'You cannot forward the document to the same section.',
                ];
            }

            /*
            |--------------------------------------------------------------------------
            | Get destination section.
            |--------------------------------------------------------------------------
            */

            $destinationSection = Section::find($toSectionId);

            if (! $destinationSection) {
                return [
                    'success' => false,
                    'status' => 404,
                    'message' => 'Destination section not found.',
                ];
            }

            if ($archiving) {

                /*
                |--------------------------------------------------------------------------
                | Archive.
                |
                | Terminal, like Completed: the document is considered
                | closed out right here — it does not need to be
                | "received" by Admin first, since there is nothing more
                | to do with it.
                |--------------------------------------------------------------------------
                */

                $document->update([
                    'current_section_id' => $toSectionId,
                    'current_employee_id' => $employee->employee_id,
                    'destination_section_id' => $toSectionId,
                    'addressee' => 'Archived',
                    'status_id' => 4,
                    'received_at' => null,
                ]);

                TrackingHistory::create([
                    'document_id' => $document->document_id,
                    'from_section_id' => $fromSectionId,
                    'to_section_id' => $toSectionId,
                    'employee_id' => $employee->employee_id,
                    'status_id' => 4,
                    'action' => 'ARCHIVED',
                    'remarks' => 'Taxpayer unresponsive. Document archived by '.
                        $destinationSection->section_name.'.',
                    'tracked_at' => now(),
                ]);

                return [
                    'success' => true,
                    'status' => 200,
                    'message' => 'Document archived successfully.',
                    'document' => $document->fresh([
                        'status',
                        'currentSection',
                        'destinationSection',
                        'currentEmployee',
                    ]),
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
                'addressee' => $validated['addressee'] ?? $document->addressee,
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
                'remarks' => 'Document forwarded to '.
                    $destinationSection->section_name.'.',
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

    /**
     * Mark a received document as completed - the end of its journey.
     *
     * Only the current holder may do this, and only while Received.
     * Nothing can be received or forwarded afterwards; the document
     * remains visible in History.
     */
    public function complete(
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

            if (! $document) {
                return [
                    'success' => false,
                    'status' => 404,
                    'message' => 'Document not found.',
                ];
            }

            if (in_array((int) $document->status_id, self::TERMINAL_STATUSES, true)) {
                return [
                    'success' => false,
                    'status' => 409,
                    'message' => $this->terminalMessage($document),
                ];
            }

            if ((int) $document->status_id !== 2) {
                return [
                    'success' => false,
                    'status' => 409,
                    'message' => 'Only a received document can be completed.',
                ];
            }

            if (
                (int) $document->current_employee_id !==
                (int) $employee->employee_id
            ) {
                return [
                    'success' => false,
                    'status' => 403,
                    'message' => 'This document is not currently assigned to you.',
                ];
            }

            $document->update([
                'status_id' => 3,
                'completed_at' => now(),
            ]);

            TrackingHistory::create([
                'document_id' => $document->document_id,
                'from_section_id' => $document->current_section_id,
                'to_section_id' => $document->current_section_id,
                'employee_id' => $employee->employee_id,
                'status_id' => 3,
                'action' => 'COMPLETED',
                'remarks' => 'Requested action carried out. Document completed.',
                'tracked_at' => now(),
            ]);

            return [
                'success' => true,
                'status' => 200,
                'message' => 'Document marked as completed.',
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