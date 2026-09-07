<?php

namespace App\Http\Controllers\Employee\Documents;

use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;

use App\Services\DocumentService;
use App\Http\Requests\Employee\Documents\StoreDocumentRequest;
use App\Models\Section;
use App\Models\Document;
use Illuminate\Http\Request;

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
    public function create(): Response
    {
        $employee = Auth::guard('employee')->user();

        return Inertia::render('Employees/Documents/Create', [
            'sections' => Section::query()
                ->where('section_id', '!=', $employee->section_id)
                ->orderBy('section_name')
                ->get([
                    'section_id',
                    'section_name',
                ]),

            'documents' => Document::query()
                ->with([
                    'status',
                    'destinationSection',
                    'currentSection',
                ])
                ->where('created_by', $employee->employee_id)
                ->latest('document_id')
                ->paginate(5)
                ->withQueryString(),
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
     * Search is handled on the frontend,
     * similar to RecentDocumentsTable.
     */
    public function history(DocumentService $documentService): Response
    {
        $employee = Auth::guard('employee')->user();

        $search = request()->input('search');

        $documents = $documentService->getHistoryDocuments(
            $employee,
            $search
        );

        return Inertia::render('Employees/Documents/History', [
            'documents' => $documents,
            'search' => $search ?? '',
        ]);
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