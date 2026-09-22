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

        /*
        * Arrivals whose details are still outstanding - the worklist
        * for whoever does step 2.
        */
        $awaitingDetails = Document::query()
            ->with(['destinationSection', 'creator.section', 'status'])
            ->whereNull('details_completed_at')
            ->where('current_section_id', $employee->section_id)
            ->latest('created_at')
            ->get();

        /*
        * A referral just registered, so its stub can be printed.
        */
        $stubId = $request->integer('stub');

        $stubDocument = $stubId
            ? Document::query()
                ->with(['destinationSection', 'creator.section'])
                ->where('document_id', $stubId)
                ->where('created_by', $employee->employee_id)
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

            'awaitingDetails' => $awaitingDetails,

            'stubDocument' => $stubDocument,

            /*
            * Which sections may do step 2. The frontend uses this to
            * hide the action for everyone else, rather than letting
            * them hit a 403 after clicking it.
            */
            'canCompleteDetails' => in_array(
                $employee->section?->section_name,
                config('referral.details_completion_sections', ['RDO']),
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
        $document = $documentService->register(
            $request->validated(),
            Auth::guard('employee')->user()
        );

        /*
        * Back to the referrals list, where the new arrival is at the
        * top waiting for its details, and its stub can be printed.
        */
        return redirect()
            ->route('referrals.index', ['stub' => $document->document_id])
            ->with('success', 'Arrival registered. The clock has started.');
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
     * Step 2 - fill in a referral's details.
     */
    public function complete(
        CompleteDocumentRequest $request,
        Document $document,
        DocumentService $documentService
    ): RedirectResponse {
        $documentService->completeDetails(
            $document,
            $request->validated(),
            Auth::guard('employee')->user()
        );

        return redirect()
            ->route('referrals.index')
            ->with('success', 'Referral details completed.');
    }
}
