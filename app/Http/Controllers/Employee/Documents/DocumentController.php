<?php

namespace App\Http\Controllers\Employee\Documents;

use App\Http\Controllers\Controller;
use App\Http\Requests\Employee\Documents\StoreDocumentRequest;
use App\Models\Document;
use App\Models\Section;
use App\Services\DocumentService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class DocumentController extends Controller
{
    /**
     * Display document list.
     */
    public function index(): Response
    {
        return Inertia::render('Employees/Documents/Create');
    }

    /**
     * Show document registration form.
     */
    public function create(
        Request $request,
        DocumentService $documentService
    ): Response {
        $employee = Auth::guard('employee')->user();

        $search = $request->string('search')->toString();

        return Inertia::render('Employees/Documents/Create', [
            'sections' => Section::query()
                ->where('section_id', '!=', $employee->section_id)
                ->orderBy('section_name')
                ->get([
                    'section_id',
                    'section_name',
                ]),

            /*
            * Selectable transaction / document types.
            */
            'transactionTypes' => config('transaction_types'),

            'documents' => $documentService->getRegisteredDocuments(
                $employee,
                $search
            ),

            /*
            * Echo the keyword back so the input stays filled
            * after the server round-trip.
            */
            'filters' => [
                'search' => $search,
            ],
        ]);
    }

    /**
     * Store/register a document.
     */
    public function store(
        StoreDocumentRequest $request,
        DocumentService $documentService
    ): RedirectResponse {
        $documentService->register(
            $request->validated()
        );

        return redirect()
            ->route('documents.create')
            ->with('success', 'Document registered successfully.');
    }

    /**
     * Display document history visible to the employee.
     *
     * Search is applied in the database before pagination, so a
     * matching document is found regardless of which page it
     * would otherwise appear on.
     */
    public function history(
        Request $request,
        DocumentService $documentService
    ): Response {
        $employee = Auth::guard('employee')->user();

        $search = $request->string('search')->toString();

        $documents = $documentService->getHistoryDocuments(
            $employee,
            $search
        );

        return Inertia::render(
            'Employees/Documents/History',
            [
                'documents' => $documents,

                /*
                * Echo the keyword back so the input stays filled
                * after the server round-trip.
                */
                'filters' => [
                    'search' => $search,
                ],
            ]
        );
    }

    /**
     * Display documents currently held by the employee.
     */
    public function documents(): Response
    {
        $employee = Auth::guard('employee')->user();

        $documents = Document::query()
            ->with([
                'status',
                'currentSection',
                'destinationSection',
                'currentEmployee',
            ])
            ->where(
                'current_employee_id',
                $employee->employee_id
            )
            ->whereHas('status', function ($query) {
                $query->where(
                    'status_name',
                    'Received'
                );
            })
            ->latest('updated_at')
            ->get();

        return Inertia::render(
            'Employees/Documents/Documents',
            [
                'documents' => $documents,
            ]
        );
    }
}
