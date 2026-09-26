<?php

namespace App\Http\Controllers\Employee\Documents;

use App\Http\Controllers\Controller;
use App\Http\Requests\Employee\Documents\CompleteDocumentRequest;
use App\Http\Requests\Employee\Documents\StoreDocumentRequest;
use App\Models\Document;
use App\Models\Section;
use App\Services\DocumentService;
use Illuminate\Http\JsonResponse;
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
        * This section's own register of referrals, whether or not they
        * are finished. Scoped by who registered it rather than who is
        * holding it: once a referral is completed and forwarded it is in
        * somebody else's hands, and it still belongs in the register of
        * slips this office issued.
        */
        $register = fn () => Document::query()
            ->whereHas(
                'creator',
                fn ($query) => $query->where('section_id', $employee->section_id)
            );

        /*
        * 'waiting' - registered at the counter, details outstanding.
        * 'slip'    - step 2 done, so it has a reference slip.
        */
        $filter = $request->string('status')->toString();

        $documents = $register()
            ->with(['destinationSection', 'creator.section', 'status', 'latestTrackingHistory'])
            ->when(
                $filter === 'waiting',
                fn ($query) => $query->whereNull('details_completed_at')
            )
            ->when(
                $filter === 'slip',
                fn ($query) => $query->whereNotNull('details_completed_at')
            )
            ->when(
                filled($search),
                fn ($query) => $documentService->applySearch($query, $search)
            )
            /*
            * Oldest first while looking at outstanding work, because the
            * one that has waited longest is holding up a taxpayer.
            * Newest first otherwise, which is how a register reads.
            */
            ->when(
                $filter === 'waiting',
                fn ($query) => $query->oldest('created_at'),
                fn ($query) => $query->latest('created_at')
            )
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Employees/Referrals/Index', [
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
                'status' => $filter,
            ],

            'documents' => $documents,

            /*
            * For the tabs, counted over the whole register rather than
            * the page being shown.
            */
            'counts' => [
                'all' => $register()->count(),
                'waiting' => $register()->whereNull('details_completed_at')->count(),
                'slip' => $register()->whereNotNull('details_completed_at')->count(),
            ],

            /*
            * Which frame to open on. The dashboard's "New referral"
            * button still arrives with ?new=1.
            */
            'frame' => $request->boolean('new')
                ? 'register'
                : ($request->string('frame')->toString() ?: 'list'),

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
        * Straight back where they were - the desk for a counter
        * account, the referrals list for everyone else - with the new
        * arrival at the top of it.
        *
        * Nothing is printed here. Step 1 has not decided where the
        * document goes, so there is no slip to attach yet; the QR
        * leaves on the reference slip once step 2 is done.
        */
        return back()->with(
            'success',
            'Arrival registered. The clock has started.'
        );
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
                'comments.author',
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
     * One document with its full movement trail, as JSON.
     *
     * The history list carries only a taxpayer and a date; this is what
     * the browser asks for when someone opens a row. Loading the trail
     * for every row instead would mean sending most of the archive on
     * every page of history.
     */
    public function detail(
        Document $document,
        DocumentService $documentService
    ): JsonResponse {
        $found = $documentService->findForEmployee(
            $document->document_id,
            Auth::guard('employee')->user()
        );

        /*
        * Not visible to this employee is answered the same as not
        * existing, so the response does not confirm it is there.
        */
        abort_if($found === null, 404);

        return response()->json(['document' => $found]);
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
