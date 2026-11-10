<?php

namespace App\Http\Controllers\Employee\Documents;

use App\Http\Controllers\Controller;
use App\Http\Requests\Employee\Documents\CompleteDocumentRequest;
use App\Http\Requests\Employee\Documents\StoreDocumentRequest;
use App\Http\Requests\Employee\Documents\StoreReferralRequest;
use App\Http\Requests\Employee\Documents\StoreSectionReferralRequest;
use App\Models\Document;
use App\Models\Section;
use App\Models\EmployeeAcc;
use App\Services\DocumentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;


class DocumentController extends Controller
{
    protected const REPORT_LIMIT = 500;

    public function index(): Response
    {
        return Inertia::render('Employees/Documents/Create');
    }

    public function referrals(
        Request $request,
        DocumentService $documentService
    ): Response {
        /** @var \App\Models\EmployeeAcc $employee */
        $employee = Auth::guard('employee')->user();

        $search = $request->string('search')->toString();

        $register = fn () => Document::query()->visibleTo($employee);

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
            ->when(
                $filter === 'waiting',
                fn ($query) => $query->oldest('created_at'),
                fn ($query) => $query->latest('created_at')
            )
            ->paginate(5)
            ->withQueryString();

        $sectionColumns = ['section_id', 'section_name', 'section_code', 'description'];

        return Inertia::render('Employees/Referrals/Index', [
            'sections' => Section::query()
                ->where('section_id', '!=', $employee->section_id)
                ->orderBy('section_name')
                ->get($sectionColumns),

            'referralOptions' => config('referral'),

            'fromSection' => $employee->section?->only($sectionColumns),

            'filters' => [
                'search' => $search,
                'status' => $filter,
            ],

            'documents' => $documents,

            'counts' => [
                'all' => $register()->count(),
                'waiting' => $register()->whereNull('details_completed_at')->count(),
                'slip' => $register()->whereNotNull('details_completed_at')->count(),
            ],

            'reportDocuments' => fn () => $this->reportDocuments($request, $employee),

            'releasedBy' => fn () => $employee->display_name ?? $employee->username,

            'openSlipFor' => $request->integer('slip') ?: null,

            'frame' => $request->boolean('new')
                ? 'register'
                : ($request->string('frame')->toString() ?: 'list'),

            'usesForm2309' => in_array(
                $employee->section?->section_name,
                config('referral.form_2309_sections', ['RDO']),
                true
            ),

            'canCompleteDetails' => in_array(
                $employee->section?->section_name,
                config('referral.details_completion_sections', ['RDO']),
                true
            ),
        ]);
    }

    protected function reportDate(mixed $value): ?string
    {
        return is_string($value) && preg_match('/^\d{4}-\d{2}-\d{2}$/', $value)
            ? $value
            : null;
    }

    protected function reportDocuments(Request $request, EmployeeAcc $employee): array
    {
        if (! $request->boolean('report')) {
            return [];
        }

        $from = $this->reportDate($request->query('from'));
        $until = $this->reportDate($request->query('until'));

        if (! $from || ! $until || $from > $until) {
            return [];
        }

        return Document::query()
            ->with('destinationSection:section_id,section_name')
            ->whereHas(
                'creator',
                fn ($query) => $query->whereIn('section_id', $employee->visibleSectionIds())
            )
            ->whereNull('deletion_approved_at')
            ->whereDate('created_at', '>=', $from)
            ->whereDate('created_at', '<=', $until)
            ->oldest('created_at')
            ->limit(self::REPORT_LIMIT)
            ->get([
                'document_id',
                'tracking_number',
                'taxpayer_name',
                'concern',
                'document_date',
                'destination_section_id',
                'created_at',
            ])
            ->map(fn (Document $document) => [
                'document_id' => $document->document_id,
                'tracking_number' => $document->tracking_number,
                'taxpayer_name' => $document->taxpayer_name,
                'concern' => $document->concern,
                'document_date' => $document->document_date,
                'destination' => $document->destinationSection?->section_name,
            ])
            ->values()
            ->all();
    }

    public function create(): RedirectResponse
    {
        return redirect()->route('referrals.index');
    }

    public function store(
        StoreDocumentRequest $request,
        DocumentService $documentService
    ): RedirectResponse {
        $documentService->register(
            $request->validated(),
            Auth::guard('employee')->user()
        );

        return back()->with(
            'success',
            'Arrival registered. The clock has started.'
        );
    }

    public function storeReferral(
        StoreReferralRequest $request,
        DocumentService $documentService
    ): RedirectResponse {
        $document = $documentService->registerComplete(
            $request->validated(),
            Auth::guard('employee')->user()
        );

        return redirect()
            ->route('referrals.index', ['slip' => $document->document_id])
            ->with('success', 'Referral registered. Its slip is ready to print.');
    }

    public function storeSectionReferral(
        StoreSectionReferralRequest $request,
        DocumentService $documentService
    ): RedirectResponse {
        $document = $documentService->registerSectionReferral(
            $request->validated(),
            Auth::guard('employee')->user()
        );

        return redirect()
            ->route('referrals.index', ['slip' => $document->document_id])
            ->with('success', 'Referral registered. Its slip is ready to print.');
    }

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

                'filters' => [
                    'search' => $search,
                ],
            ]
        );
    }

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

    public function detail(
        Document $document,
        DocumentService $documentService
    ): JsonResponse {
        $found = $documentService->findForEmployee(
            $document->document_id,
            Auth::guard('employee')->user()
        );

        abort_if($found === null, 404);

        return response()->json(['document' => $found]);
    }

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

    public function updateSectionReferral(
        StoreSectionReferralRequest $request,
        Document $document,
        DocumentService $documentService
    ): RedirectResponse {
        $documentService->updateSectionReferral($document, $request->validated());

        return back()->with('success', 'Referral updated.');
    }

    public function updateReferral(
        StoreReferralRequest $request,
        Document $document,
        DocumentService $documentService
    ): RedirectResponse {
        $documentService->updateReferral(
            $document,
            $request->validated(),
            Auth::guard('employee')->user()
        );

        return back()->with('success', 'Referral updated.');
    }

       public function requestSectionDeletion(
        Request $request,
        Document $document,
        DocumentService $documentService
    ): RedirectResponse {
        $request->merge(['reason' => trim((string) $request->input('reason'))]);

        $data = $request->validate([
            'reason' => ['required', 'string', 'min:10', 'max:500'],
        ], [
            'reason.required' => 'Please type the reason for deleting this referral.',
            'reason.min' => 'The reason must be at least 10 characters.',
        ]);

        /** @var \App\Models\EmployeeAcc $employee */
        $employee = Auth::guard('employee')->user();

        $documentService->requestSectionReferralDeletion(
            $document,
            $employee,
            $data['reason'],
        );

        return back()->with('success', 'Deletion request sent to the super admin.');
    }
}