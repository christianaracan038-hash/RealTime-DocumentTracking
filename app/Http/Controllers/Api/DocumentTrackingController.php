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
    private const PENDING = 1;
    private const RECEIVED = 2;
    private const COMPLETED = 3;
    private const ARCHIVED = 4;
    private const FOR_ARCHIVING = 5;

    private const TERMINAL_STATUSES = [self::COMPLETED, self::ARCHIVED];
    private const AWAITING_RECEIPT_STATUSES = [self::PENDING, self::FOR_ARCHIVING];

    private const ADMIN_SECTION_CODE = 'ADMIN';

    private function terminalMessage(Document $document): string
    {
        return match ((int) $document->status_id) {
            self::COMPLETED => 'This document has been completed. Nothing more to do.',
            self::ARCHIVED => 'This document has been archived. Nothing more to do.',
            default => 'This document can no longer be moved.',
        };
    }

    private function isAdminSection(Section $section): bool
    {
        return strcasecmp((string) $section->section_code, self::ADMIN_SECTION_CODE) === 0
            || strcasecmp((string) $section->section_name, self::ADMIN_SECTION_CODE) === 0;
    }

    public function scan(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'qr_value' => ['nullable', 'required_without:tracking_number', 'string', 'max:255'],
            'tracking_number' => ['nullable', 'required_without:qr_value', 'string', 'max:255'],
            'mode' => ['nullable', 'in:receive,forward'],
        ]);

        $employee = Auth::guard('employee')->user();

        $mode = $validated['mode'] ?? 'receive';

        $qrValue = trim((string) ($validated['qr_value'] ?? ''));
        $trackingNumber = trim((string) ($validated['tracking_number'] ?? ''));

        $document = Document::query()
            ->with([
                'status',
                'currentSection',
                'destinationSection',
                'currentEmployee',
                'creator',
            ])
            ->when(
                $qrValue !== '',
                fn ($query) => $query->where('qr_value', $qrValue),
                fn ($query) => $query->whereRaw('UPPER(tracking_number) = ?', [mb_strtoupper($trackingNumber)])
            )
            ->first();

        if (! $document) {
            return response()->json([
                'message' => $qrValue !== ''
                    ? 'Document not found.'
                    : 'No document found with that tracking number.',
            ], 404);
        }

        $statusId = (int) $document->status_id;

        if (in_array($statusId, self::TERMINAL_STATUSES, true)) {
            return response()->json([
                'message' => $this->terminalMessage($document),
                'status' => $document->status?->status_name,
            ], 409);
        }

        if ($mode === 'receive') {
            if (
                (int) $employee->section_id !==
                (int) $document->destination_section_id
            ) {
                return response()->json([
                    'message' => 'You are not authorized to receive this document.',
                ], 403);
            }

            if (! in_array($statusId, self::AWAITING_RECEIPT_STATUSES, true)) {
                return response()->json([
                    'message' => 'This document has already been received.',
                    'status' => $document->status?->status_name,
                ], 409);
            }

            return response()->json([
                'success' => true,
                'message' => $statusId === self::FOR_ARCHIVING
                    ? 'Document can be received. It will be archived once received.'
                    : 'Document can be received.',
                'mode' => 'receive',
                'document' => $document,
            ]);
        }

        if ($statusId !== self::RECEIVED) {
            return response()->json([
                'message' => 'This document must be received before it can be forwarded.',
                'status' => $document->status?->status_name,
            ], 409);
        }

        if (
            (int) $document->current_employee_id !==
            (int) $employee->employee_id
        ) {
            return response()->json([
                'message' => 'This document is not currently assigned to you.',
            ], 403);
        }

        $sections = Section::query()
            ->whereNotIn('section_id', array_filter([
                $employee->section_id,
            ]))
            ->orderBy('section_name')
            ->get([
                'section_id',
                'section_code',
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

            $statusId = (int) $document->status_id;

            if (in_array($statusId, self::TERMINAL_STATUSES, true)) {
                return [
                    'success' => false,
                    'status' => 409,
                    'message' => $this->terminalMessage($document),
                ];
            }

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

            if (! in_array($statusId, self::AWAITING_RECEIPT_STATUSES, true)) {
                return [
                    'success' => false,
                    'status' => 409,
                    'message' => 'This document has already been received.',
                ];
            }

            $fromSectionId = $document->current_section_id;
            $toSectionId = $document->destination_section_id;
            $archiving = $statusId === self::FOR_ARCHIVING;
            $now = now();

            $document->update([
                'current_section_id' => $toSectionId,
                'current_employee_id' => $employee->employee_id,
                'status_id' => $archiving ? self::ARCHIVED : self::RECEIVED,
                'received_at' => $now,
                'archived_at' => $archiving ? $now : null,
            ]);

            TrackingHistory::create([
                'document_id' => $document->document_id,
                'from_section_id' => $fromSectionId,
                'to_section_id' => $toSectionId,
                'employee_id' => $employee->employee_id,
                'status_id' => self::RECEIVED,
                'action' => 'RECEIVED',
                'remarks' => 'Document received by destination section.',
                'tracked_at' => $now,
            ]);

            if ($archiving) {
                $sectionName = $document->destinationSection?->section_name ?? 'Admin';
                $forwardedBy = DB::table('employees_acc')
                    ->where('employee_id', $document->archived_by)
                    ->value('full_name');

                TrackingHistory::create([
                    'document_id' => $document->document_id,
                    'from_section_id' => $toSectionId,
                    'to_section_id' => $toSectionId,
                    'employee_id' => $employee->employee_id,
                    'status_id' => self::ARCHIVED,
                    'action' => 'ARCHIVED',
                    'remarks' => 'Taxpayer unresponsive. Forwarded for archiving by '.($forwardedBy ?: 'Unknown').'. Received and archived by '.$sectionName.'.',
                    'tracked_at' => $now,
                ]);
            }

            return [
                'success' => true,
                'status' => 200,
                'archived' => $archiving,
                'message' => $archiving
                    ? 'Document received and archived successfully.'
                    : 'Document received successfully.',
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

            if ((int) $document->status_id !== self::RECEIVED) {
                return [
                    'success' => false,
                    'status' => 409,
                    'message' => 'Only received documents can be forwarded.',
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

            $fromSectionId = $document->current_section_id;
            $toSectionId = (int) $validated['destination_section_id'];

            if ((int) $fromSectionId === $toSectionId) {
                return [
                    'success' => false,
                    'status' => 422,
                    'message' => 'You cannot forward the document to the same section.',
                ];
            }

            $destinationSection = Section::find($toSectionId);

            if (! $destinationSection) {
                return [
                    'success' => false,
                    'status' => 404,
                    'message' => 'Destination section not found.',
                ];
            }

            if ($archiving && ! $this->isAdminSection($destinationSection)) {
                return [
                    'success' => false,
                    'status' => 422,
                    'message' => 'Documents can only be archived through the Admin section.',
                ];
            }

            $document->update([
                'current_section_id' => $fromSectionId,
                'current_employee_id' => $employee->employee_id,
                'destination_section_id' => $toSectionId,
                'addressee' => $validated['addressee'] ?? $document->addressee,
                'status_id' => $archiving ? self::FOR_ARCHIVING : self::PENDING,
                'received_at' => null,
                'archived_by' => $archiving ? $employee->employee_id : null,
            ]);

            TrackingHistory::create([
                'document_id' => $document->document_id,
                'from_section_id' => $fromSectionId,
                'to_section_id' => $toSectionId,
                'employee_id' => $employee->employee_id,
                'status_id' => $archiving ? self::FOR_ARCHIVING : self::PENDING,
                'action' => 'FORWARDED',
                'remarks' => $archiving
                    ? 'Taxpayer unresponsive. Document forwarded to '.$destinationSection->section_name.' for archiving.'
                    : 'Document forwarded to '.$destinationSection->section_name.'.',
                'tracked_at' => now(),
            ]);

            return [
                'success' => true,
                'status' => 200,
                'message' => $archiving
                    ? 'Document forwarded for archiving. It will be archived once '.$destinationSection->section_name.' receives it.'
                    : 'Document forwarded successfully.',
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

            if ((int) $document->status_id !== self::RECEIVED) {
                return [
                    'success' => false,
                    'status' => 409,
                    'message' => 'Only a received document can be completed.',
                ];
            }

            if ($document->details_completed_at === null) {
                return [
                    'success' => false,
                    'status' => 409,
                    'message' => 'This referral is still awaiting its details. Complete them before closing the document.',
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
                'status_id' => self::COMPLETED,
                'completed_at' => now(),
            ]);

            TrackingHistory::create([
                'document_id' => $document->document_id,
                'from_section_id' => $document->current_section_id,
                'to_section_id' => $document->current_section_id,
                'employee_id' => $employee->employee_id,
                'status_id' => self::COMPLETED,
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