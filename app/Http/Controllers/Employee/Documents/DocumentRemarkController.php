<?php

namespace App\Http\Controllers\Employee\Documents;

use App\Http\Controllers\Controller;
use App\Models\Document;
use App\Models\TrackingHistory;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class DocumentRemarkController extends Controller
{
    public function store(Request $request, Document $document): RedirectResponse
    {
        $employee = Auth::guard('employee')->user();

        $validated = $request->validate([
            'body' => ['required', 'string', 'max:1000'],
        ]);

        abort_unless(
            (int) $document->status_id === 2
            && (int) $document->current_section_id === (int) $employee->section_id,
            403,
            'Only the section holding this received document can add remarks.'
        );

        DB::transaction(function () use ($document, $employee, $validated) {

            // Update current holder to the employee who added remarks.
            $document->current_employee_id = $employee->employee_id;

            // Do not modify status, section, or timer-related fields.
            $document->save();

            // Record remarks in tracking history.
            TrackingHistory::create([
                'document_id' => $document->document_id,
                'action' => 'REMARKS',
                'from_section_id' => $employee->section_id,
                'to_section_id' => $employee->section_id,
                'employee_id' => $employee->employee_id,
                'status_id' => $document->status_id,
                'remarks' => trim($validated['body']),
                'tracked_at' => now(),
            ]);
        });

        return back()->with(
            'success',
            'Remarks added successfully. You are now the current holder of this document.'
        );
    }
}
