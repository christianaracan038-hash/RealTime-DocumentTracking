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
    private function authorize(Document $document, string $action): bool
    {
        $employee = Auth::guard('employee')->user();

        if ($action === 'receive') {
            return $employee->section_id === $document->destination_section_id;
        }

        if ($action === 'forward') {  
            return $employee->employee_id === $document->current_employee_id;
        }

        return false;
    }

    public function scan(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'qr_value' => ['required', 'string', 'max:255'],
            'mode' => ['nullable', 'in:receive,forward'],  
        ]);

        $mode = $validated['mode'] ?? 'receive';

        $document = Document::with([
                'status:status_id,status_name',
                'currentSection:section_id,section_name',
                'destinationSection:section_id,section_name',
                'currentEmployee:employee_id,employee_name',
            ])
            ->where('qr_value', $validated['qr_value'])
            ->firstOrFail();

        if ($mode === 'receive') {
            if (!$this->authorize($document, 'receive')) {
                return response()->json([
                    'message' => 'You are not authorized to receive this document.',
                ], 403);
            }

            if ($document->status_id !== 1) {
                return response()->json([
                    'message' => 'This document has already been received.',
                    'status' => $document->status->status_name,  
                ], 409);
            }

            return response()->json([
                'success' => true,
                'message' => 'Document can be received.',
                'mode' => 'receive',
                'document' => $document,
            ]);

        } else {
            if ($document->status_id !== 2) {
                return response()->json([  
                    'message' => 'This document must be received before it can be forwarded.',
                    'status' => $document->status->status_name,
                ], 409);
            }

            if (!$this->authorize($document, 'forward')) {
                return response()->json([
                    'message' => 'This document is not currently assigned to you.', 
                ], 403);
            }

            $sections = Section::where('section_id', '!=', $document->current_section_id)
                ->orderBy('section_name')  
                ->get(['section_id', 'section_name']);

            return response()->json([
                'success' => true,
                'message' => 'Document verified for forwarding.',
                'mode' => 'forward',
                'document' => $document,
                'sections' => $sections,
            ]);
        }
    }

    public function receive(Document $document): JsonResponse
    {
        $employee = Auth::guard('employee')->user();

        $document = Document::where('document_id', $document->document_id)  
            ->where('destination_section_id', $employee->section_id)
            ->where('status_id', 1)  
            ->firstOrFail();

        $document->update([
            'current_section_id' => $employee->section_id,
            'current_employee_id' => $employee->employee_id,
            'status_id' => 2,
            'received_at' => now(),
        ]);

        TrackingHistory::create([
            'document_id' => $document->document_id,
            'from_section_id' => $document->current_section_id,  
            'to_section_id' => $employee->section_id,
            'employee_id' => $employee->employee_id,
            'status_id' => 2,
            'action' => 'RECEIVED',  
            'remarks' => 'Document received by destination section.',
            'tracked_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Document received successfully.',
            'document' => $document->fresh([
                'status:status_id,status_name',
                'currentSection:section_id,section_name',
                'destinationSection:section_id,section_name',
                'currentEmployee:employee_id,employee_name',
            ]),  
        ]);
    }

    public function forward(Request $request, Document $document): JsonResponse
    {
        $validated = $request->validate([
            'destination_section_id' => [
                'required',
                'integer',
                'exists:sections,section_id',
            ],  
        ]);
        
        $employee = Auth::guard('employee')->user();

        $document = Document::where('document_id', $document->document_id)
            ->where('current_employee_id', $employee->employee_id)
            ->where('status_id', 2)  
            ->firstOrFail();

        if ($validated['destination_section_id'] === $document->current_section_id) { 
            return response()->json([
                'success' => false,  
                'message' => 'You cannot forward the document to the same section.',
            ], 422);
        }

        $document->update([
            'destination_section_id' => $validated['destination_section_id'],
            'status_id' => 1,
        ]);

        TrackingHistory::create([
            'document_id' => $document->document_id,
            'from_section_id' => $document->current_section_id,
            'to_section_id' => $validated['destination_section_id'],
            'employee_id' => $employee->employee_id,
            'status_id' => 1,
            'action' => 'FORWARDED',
            'remarks' => 'Document forwarded to ' . 
                Section::find($validated['destination_section_id'])->section_name . '.',  
            'tracked_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Document forwarded successfully.',
            'document' => $document->fresh([
                'status:status_id,status_name',
                'currentSection:section_id,section_name',
                'destinationSection:section_id,section_name',
                'currentEmployee:employee_id,employee_name',  
            ]),
        ]);
    }
}