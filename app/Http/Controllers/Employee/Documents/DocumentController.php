<?php

namespace App\Http\Controllers\Employee\Documents;

use App\Http\Controllers\Controller;
use App\Http\Requests\Employee\Documents\CompleteDocumentRequest;
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
     * Referrals this employee registered.
     *
     * Also where new ones are registered from: the dashboard's button
     * links here with ?new=1 so the form opens on arrival. If a draft
     * document id is passed via ?draft=, its details (tracking number,
     * QR) are loaded so the form can complete it instead of creating
     * a new document from scratch.
     */
    public function referrals(
        Request $request,
        DocumentService $documentService
    ): Response {
        $employee = Auth::guard('employee')->user();

        $search = $request->string('search')->toString();

        $draftId = $request->integer('draft');

        $draftDocument = $draftId
            ? Document::query()
                ->where('document_id', $draftId)
                ->where('created_by', $employee->employee_id)
                ->where('status_id', 0)
                ->first()
            : null;

        return Inertia::render('Employees/Referrals/Index', [
            'referrals' => $documentService->getRegisteredDocuments(
                $employee,
                $search
            ),

            /*
            * A referral cannot be addressed to the section sending it.
            */
            'sections' => Section::query()
                ->where('section_id', '!=', $employee->section_id)
                ->orderBy('section_name')
                ->get([
                    'section_id',
                    'section_name',
                    'section_code',
                    'description',
                ]),

            'referralOptions' => config('referral'),

            'fromSection' => $employee->section?->only([
                'section_id',
                'section_name',
                'section_code',
                'description',
            ]),

            'filters' => [
                'search' => $search,
            ],

            /*
            * Open the registration form as soon as the page loads.
            */
            'openForm' => $request->boolean('new'),

            'draftDocument' => $draftDocument,

            /*
            * Only RDO-section employees may complete a draft's
            * referral details. The frontend uses this to hide the
            * "Complete referral" action for everyone else, instead
            * of letting them hit a 403 after clicking it.
            */
            'canCompleteDrafts' => in_array(
                $employee->section?->section_name,
                config('referral.draft_completion_sections', ['RDO']),
                true
            ),
        ]);
    }

    /**
     * The old standalone registration page.
     */
    public function create(): RedirectResponse
    {
        return redirect()->route('referrals.index');
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

        /*
        * Back to the referrals list, where the new row is now at the
        * top and another can be added.
        */
        return redirect()
            ->route('referrals.index')
            ->with('success', 'Referral registered.');
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
                'creator.section',
                'latestTrackingHistory',
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

    /**
     * Step 1 — generate a draft document with its tracking number and
     * QR code. The referral's details are filled in afterward, via
     * complete().
     */
    public function quickCreate(DocumentService $documentService): RedirectResponse
    {
        $employee = Auth::guard('employee')->user();

        $document = $documentService->createDraft($employee);

        return redirect()->route('referrals.index', [
            'new' => 1,
            'draft' => $document->document_id,
        ]);
    }

    /**
     * Step 2 — complete a draft document's referral details.
     */
    public function complete(
        CompleteDocumentRequest $request,
        Document $document,
        DocumentService $documentService
    ): RedirectResponse {
        $documentService->completeDraft($document, $request->validated());

        return redirect()
            ->route('referrals.index')
            ->with('success', 'Referral registered.');
    }
}