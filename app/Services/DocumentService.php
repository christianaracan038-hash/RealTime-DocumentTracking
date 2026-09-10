<?php

namespace App\Services;

use App\Models\Document;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use SimpleSoftwareIO\QrCode\Facades\QrCode;

class DocumentService
{
    /**
     * Register a new document.
     */
    public function register(array $data): Document
    {
        return DB::transaction(function () use ($data) {

            $employee = Auth::guard('employee')->user();

            $document = Document::create([

                'tracking_number' => $this->generateTrackingNumber(),

                'document_date' => $data['document_date'],

                'taxpayer_name' => $data['taxpayer_name'],

                'transaction_type' => $data['transaction_type'],

                'description' => $data['description'],

                'reference_number' => $data['reference_number'] ?? null,

                'status_id' => 1,

                'current_section_id' => $employee->section_id,

                'current_employee_id' => $employee->employee_id,

                'destination_section_id' => $data['destination_section_id'],

                'created_by' => $employee->employee_id,

            ]);

            $this->generateQrCode($document);

            return $document;
        });
    }

    /**
     * Generate Tracking Number.
     */
    private function generateTrackingNumber(): string
    {
        $lastId = Document::max('document_id') + 1;

        return 'DOC-'.
            now()->format('Ymd').
            '-'.
            str_pad($lastId, 6, '0', STR_PAD_LEFT);
    }

    private function generateQrCode(Document $document)
    {
        // QR content
        $qrValue = $document->tracking_number;

        // File name
        $fileName = $qrValue.'.svg';

        // Generate QR SVG
        $qrImage = QrCode::format('svg')
            ->size(300)
            ->margin(2)
            ->generate($qrValue);

        // Save to storage/app/public/qrcodes
        Storage::disk('public')->put(
            'qrcodes/'.$fileName,
            $qrImage
        );

        // Update document
        $document->update([
            'qr_value' => $qrValue,
            'qr_path' => 'storage/qrcodes/'.$fileName,
            'qr_generated_at' => now(),
        ]);

    }

    /**
     * Documents registered by this employee, newest first.
     *
     * Search runs in the database before pagination so the
     * registration page behaves the same way as History.
     */
    public function getRegisteredDocuments($employee, ?string $search = null)
    {
        return Document::query()
            ->with([
                'status',
                'destinationSection',
                'currentSection',
            ])
            ->where('created_by', $employee->employee_id)
            ->when(
                filled($search),
                fn ($query) => $this->applySearch($query, $search)
            )
            ->latest('document_id')
            ->paginate(5)
            ->withQueryString();
    }

    public function getHistoryDocuments($employee, ?string $search = null)
    {
        return Document::query()
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
                * Complete movement history
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
            */
            ->where(function ($query) use ($employee) {

                /*
                * 1. Created by this employee
                */
                $query->where(
                    'created_by',
                    $employee->employee_id
                )

                /*
                * 2. Currently held by this employee
                */
                    ->orWhere(
                        'current_employee_id',
                        $employee->employee_id
                    )

                /*
                * 3. Currently inside employee's section
                */
                    ->orWhere(
                        'current_section_id',
                        $employee->section_id
                    )

                /*
                * 4. Currently destined for employee's section
                */
                    ->orWhere(
                        'destination_section_id',
                        $employee->section_id
                    )

                /*
                * 5. Employee's section appeared
                *    anywhere in document history.
                *
                * Example:
                *
                * Records -> Accounting
                * Accounting -> HR
                * HR -> Legal
                *
                * Accounting can still see the document.
                */
                    ->orWhereHas(
                        'trackingHistories',
                        function ($historyQuery) use ($employee) {

                            $historyQuery->where(function ($query) use ($employee) {

                                $query
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
            *
            * Applied to the database query BEFORE pagination, so a
            * match is found no matter which page it would have
            * landed on.
            * ==========================================================
            */
            ->when(
                filled($search),
                fn ($query) => $this->applySearch($query, $search)
            )

            /*
            * Newest registered documents first
            */
            ->latest('created_at')

            /*
            * Same pagination style as
            * RecentDocumentsTable.
            */
            ->paginate(10)

            /*
            * Preserve pagination and search query parameters.
            */
            ->withQueryString();
    }

    /**
     * Constrain a document query to rows matching the keyword.
     *
     * LOWER(...) LIKE is used instead of ILIKE so the same query runs
     * on PostgreSQL (production) and SQLite (the test suite).
     */
    protected function applySearch($query, string $search)
    {
        $keyword = '%'.mb_strtolower(trim($search)).'%';

        return $query->where(function ($query) use ($keyword) {

            /*
            * Document's own searchable columns.
            */
            $columns = [
                'taxpayer_name',
                'transaction_type',
                'tracking_number',
                'description',
                'reference_number',
            ];

            foreach ($columns as $column) {
                $query->orWhereRaw(
                    'LOWER('.$column.') LIKE ?',
                    [$keyword]
                );
            }

            /*
            * Status name, e.g. "pending".
            */
            $query->orWhereHas('status', function ($statusQuery) use ($keyword) {
                $statusQuery->whereRaw(
                    'LOWER(status_name) LIKE ?',
                    [$keyword]
                );
            });

            /*
            * Where the document is, and where it is going.
            */
            foreach (['currentSection', 'destinationSection'] as $relation) {
                $query->orWhereHas(
                    $relation,
                    function ($sectionQuery) use ($keyword) {
                        $sectionQuery->whereRaw(
                            'LOWER(section_name) LIKE ?',
                            [$keyword]
                        );
                    }
                );
            }

            /*
            * Who registered it, and who is holding it.
            */
            foreach (['creator', 'currentEmployee'] as $relation) {
                $query->orWhereHas(
                    $relation,
                    function ($employeeQuery) use ($keyword) {
                        $employeeQuery->whereRaw(
                            'LOWER(username) LIKE ?',
                            [$keyword]
                        );
                    }
                );
            }

            /*
            * Anywhere in the movement history.
            *
            * Records -> Accounting -> HR -> Legal
            *
            * Searching "Accounting" finds the document even though
            * it is now sitting in Legal.
            */
            $query->orWhereHas(
                'trackingHistories',
                function ($historyQuery) use ($keyword) {

                    $historyQuery->where(function ($historyQuery) use ($keyword) {

                        $historyQuery
                            ->whereRaw('LOWER(action) LIKE ?', [$keyword])
                            ->orWhereRaw('LOWER(remarks) LIKE ?', [$keyword])
                            ->orWhereHas(
                                'fromSection',
                                fn ($q) => $q->whereRaw(
                                    'LOWER(section_name) LIKE ?',
                                    [$keyword]
                                )
                            )
                            ->orWhereHas(
                                'toSection',
                                fn ($q) => $q->whereRaw(
                                    'LOWER(section_name) LIKE ?',
                                    [$keyword]
                                )
                            )
                            ->orWhereHas(
                                'employee',
                                fn ($q) => $q->whereRaw(
                                    'LOWER(username) LIKE ?',
                                    [$keyword]
                                )
                            );
                    });
                }
            );
        });
    }
}
