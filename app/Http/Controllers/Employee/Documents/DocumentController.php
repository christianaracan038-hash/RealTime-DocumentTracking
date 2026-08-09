<?php

namespace App\Http\Controllers\Employee\Documents;

use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\RedirectResponse;
use App\Services\DocumentService;
use App\Http\Requests\Employee\Documents\StoreDocumentRequest;
use App\Models\Section;
use App\Models\Document;
use Illuminate\Support\Facades\Auth;

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

            // Huwag isama ang sariling section
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
            ->take(10)
            ->get(),


        ]);
    }

     public function store(
        StoreDocumentRequest $request,
        DocumentService $documentService
    ): RedirectResponse {

        $documentService->register(
            $request->validated()
        );

        return redirect()->route('documents.create')
            ->with('success', 'Document registered successfully.');

    }


}