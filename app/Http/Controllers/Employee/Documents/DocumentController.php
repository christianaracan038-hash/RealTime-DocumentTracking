<?php

namespace App\Http\Controllers\Employee\Documents;

use App\Http\Controllers\Controller;
use App\Http\Requests\Employee\Documents\StoreDocumentRequest;
use App\Models\Document;
use App\Models\Section;
use App\Services\DashboardResolver;
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
     * The old standalone registration page.
     *
     * Registering now happens in a dialog on the section dashboard, so
     * this only redirects - a bookmark or an old link still lands
     * somewhere sensible.
     */
    public function create(): RedirectResponse
    {
        $employee = Auth::guard('employee')->user();

        return redirect()->to(
            DashboardResolver::resolve($employee) ?? '/'
        );
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
        * Back to the dashboard the dialog was opened from, whichever
        * section that is.
        */
        return redirect()
            ->back()
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
}
