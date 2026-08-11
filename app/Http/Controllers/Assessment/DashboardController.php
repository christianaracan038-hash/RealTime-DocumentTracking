<?php

namespace App\Http\Controllers\Assessment;

use App\Http\Controllers\Controller;
use App\Models\Document;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(): Response
    {
        $employee = Auth::guard('employee')->user();

        $incomingDocuments = Document::query()
            ->with([
                'status',
                'currentSection',
                'destinationSection',
            ])
            ->where(
                'destination_section_id',
                $employee->section_id
            )
            ->where('status_id', 1) // Pending
            ->latest('document_id')
            ->get();

        return Inertia::render('Assessment/Dashboard', [
            'incomingDocuments' => $incomingDocuments,
        ]);
    }
}