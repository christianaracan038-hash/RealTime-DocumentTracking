<?php

namespace App\Http\Controllers\Employee\Documents;

use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
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
            /*
             * Huwag isama ang sariling section
             */
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
                ->where(
                    'created_by',
                    $employee->employee_id
                )
                ->latest('document_id')
                ->paginate(5)
                ->withQueryString(),
        ]);
    }

    /**
     * Store/register a new document.
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
            ->with(
                'success',
                'Document registered successfully.'
            );
    }

    /**
     * Display document history.
     *
     * A document is visible to an employee when:
     *
     * - They created it
     * - They currently hold it
     * - It is currently in their section
     * - It is currently destined for their section
     * - Their section appeared anywhere in tracking history
     * - They personally performed a tracking action
     *
     * This means a document remains visible to every section
     * it has already passed through.
     */
    public function history(Request $request): Response
    {
        $employee = Auth::guard('employee')->user();

        $search = trim(
            (string) $request->input('search', '')
        );

        $documents = Document::query()
            ->with([
                /*
                 * Current document information
                 */
                'status',
                'currentSection',
                'destinationSection',
                'currentEmployee',

                /*
                 * Original creator
                 */
                'creator',

                /*
                 * Complete document route/history
                 */
                'trackingHistories' => function ($query) {
                    $query
                        ->with([
                            'fromSection',
                            'toSection',
                            'employee',
                            'status',
                        ])
                        ->orderBy('tracked_at', 'asc');
                },
            ])

            /*
             * ==========================================================
             * DOCUMENT VISIBILITY
             * ==========================================================
             *
             * The employee can see the document if:
             *
             * 1. They created it
             * 2. They currently hold it
             * 3. Their section currently has it
             * 4. Their section is the current destination
             * 5. Their section appeared in tracking history
             * 6. They personally performed an action
             */
            ->where(function ($query) use ($employee) {

                /*
                 * 1. Employee created the document
                 */
                $query->where(
                    'created_by',
                    $employee->employee_id
                )

                /*
                 * 2. Employee currently holds the document
                 */
                ->orWhere(
                    'current_employee_id',
                    $employee->employee_id
                )

                /*
                 * 3. Document is currently in employee's section
                 */
                ->orWhere(
                    'current_section_id',
                    $employee->section_id
                )

                /*
                 * 4. Document is currently destined
                 *    for employee's section
                 */
                ->orWhere(
                    'destination_section_id',
                    $employee->section_id
                )

                /*
                 * 5. Employee's section appeared anywhere
                 *    in the tracking history.
                 *
                 * Example:
                 *
                 * Records -> Accounting
                 * Accounting -> HR
                 * HR -> Legal
                 *
                 * Accounting can still see the document
                 * even when it is already in Legal.
                 */
                ->orWhereHas(
                    'trackingHistories',
                    function ($historyQuery) use ($employee) {

                        $historyQuery->where(function (
                            $sectionQuery
                        ) use ($employee) {

                            $sectionQuery
                                ->where(
                                    'from_section_id',
                                    $employee->section_id
                                )
                                ->orWhere(
                                    'to_section_id',
                                    $employee->section_id
                                );
                        });
                    }
                )

                /*
                 * 6. Employee personally performed
                 *    a tracking action.
                 */
                ->orWhereHas(
                    'trackingHistories',
                    function ($historyQuery) use ($employee) {

                        $historyQuery->where(
                            'employee_id',
                            $employee->employee_id
                        );
                    }
                );
            })

            /*
             * ==========================================================
             * SEARCH
             * ==========================================================
             */
            ->when(
                $search !== '',
                function ($query) use ($search) {

                    $query->where(function (
                        $searchQuery
                    ) use ($search) {

                        /*
                         * Tracking number
                         */
                        $searchQuery->where(
                            'tracking_number',
                            'like',
                            "%{$search}%"
                        )

                        /*
                         * Reference number
                         */
                        ->orWhere(
                            'reference_number',
                            'like',
                            "%{$search}%"
                        )

                        /*
                         * Description
                         */
                        ->orWhere(
                            'description',
                            'like',
                            "%{$search}%"
                        )

                        /*
                         * Creator username
                         */
                        ->orWhereHas(
                            'creator',
                            function ($creatorQuery) use ($search) {

                                $creatorQuery->where(
                                    'username',
                                    'like',
                                    "%{$search}%"
                                );
                            }
                        )

                        /*
                         * Current holder username
                         */
                        ->orWhereHas(
                            'currentEmployee',
                            function ($employeeQuery) use ($search) {

                                $employeeQuery->where(
                                    'username',
                                    'like',
                                    "%{$search}%"
                                );
                            }
                        )

                        /*
                         * Current section
                         */
                        ->orWhereHas(
                            'currentSection',
                            function ($sectionQuery) use ($search) {

                                $sectionQuery->where(
                                    'section_name',
                                    'like',
                                    "%{$search}%"
                                );
                            }
                        )

                        /*
                         * Destination section
                         */
                        ->orWhereHas(
                            'destinationSection',
                            function ($sectionQuery) use ($search) {

                                $sectionQuery->where(
                                    'section_name',
                                    'like',
                                    "%{$search}%"
                                );
                            }
                        )

                        /*
                         * Search inside complete tracking history
                         */
                        ->orWhereHas(
                            'trackingHistories',
                            function ($historyQuery) use ($search) {

                                $historyQuery->where(function (
                                    $query
                                ) use ($search) {

                                    /*
                                     * From section
                                     */
                                    $query->whereHas(
                                        'fromSection',
                                        function ($sectionQuery) use ($search) {

                                            $sectionQuery->where(
                                                'section_name',
                                                'like',
                                                "%{$search}%"
                                            );
                                        }
                                    )

                                    /*
                                     * To section
                                     */
                                    ->orWhereHas(
                                        'toSection',
                                        function ($sectionQuery) use ($search) {

                                            $sectionQuery->where(
                                                'section_name',
                                                'like',
                                                "%{$search}%"
                                            );
                                        }
                                    )

                                    /*
                                     * Employee who performed action
                                     */
                                    ->orWhereHas(
                                        'employee',
                                        function ($employeeQuery) use ($search) {

                                            $employeeQuery->where(
                                                'username',
                                                'like',
                                                "%{$search}%"
                                            );
                                        }
                                    )

                                    /*
                                     * Action
                                     */
                                    ->orWhere(
                                        'action',
                                        'like',
                                        "%{$search}%"
                                    )

                                    /*
                                     * Remarks
                                     */
                                    ->orWhere(
                                        'remarks',
                                        'like',
                                        "%{$search}%"
                                    );
                                });
                            }
                        );
                    });
                }
            )

            /*
             * Newest documents first
             */
            ->latest('created_at')

            /*
             * 10 per page
             */
            ->paginate(10)

            /*
             * Keep ?search=... when changing pages
             */
            ->withQueryString();

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

    /**
     * Display documents currently held by employee.
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