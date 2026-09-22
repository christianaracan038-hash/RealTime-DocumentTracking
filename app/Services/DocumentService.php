<?php

namespace App\Services;

use App\Models\Document;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use SimpleSoftwareIO\QrCode\Facades\QrCode;

class DocumentService
{
    /**
     * Turn a list of ticked options into one line for the slip.
     *
     * "Other" is replaced by whatever was typed for it, so the stored
     * value reads naturally: "Approval, Signature, Return to sender".
     */
    private function joinChoices(array $ticked, ?string $other): string
    {
        $choices = [];

        foreach ($ticked as $choice) {
            $choices[] = $choice === 'Other' ? trim((string) $other) : $choice;
        }

        return implode(', ', array_filter($choices, fn ($c) => $c !== ''));
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

    /**
     * Rebuild a QR image that is missing from this machine's disk.
     *
     * The payload is the tracking number, so the rebuilt image is
     * identical to the original. Repairs documents registered on
     * another machine, whose files were never on this one.
     */
    public function regenerateQrCode(Document $document): void
    {
        $this->generateQrCode($document);
    }

    private function generateQrCode(Document $document)
    {
        // QR content
        $qrValue = $document->qr_value ?: $document->tracking_number;

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

                /*
                * The slip's "From" is the section that registered it,
                * which stays fixed even after the document moves on.
                */
                'creator.section',
                'latestTrackingHistory',
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
                'latestTrackingHistory',

                /*
                * Original creator
                */
                'creator.section',

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
                'concern',
                'referred_for',
                'remarks',
                'office_code',
                'tracking_number',
                'transaction_type',
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

    /**
     * Step 1 - register a document's arrival.
     *
     * This is the moment the office's clock starts. The tracking number
     * and QR are produced here, with the routing facts read off the
     * paper, so the document can be forwarded the same morning. The
     * descriptive fields are filled in later by completeDetails(),
     * which never touches the tracking number, the QR, or created_at.
     */
    public function register(array $data, $employee): Document
    {
        return DB::transaction(function () use ($data, $employee) {

            $document = Document::create([
                'tracking_number' => $this->generateTrackingNumber(),

                'document_date' => $data['document_date'],
                'taxpayer_name' => $data['taxpayer_name'],

                'status_id' => 1, // Pending - routable straight away

                'current_section_id' => $employee->section_id,
                'current_employee_id' => $employee->employee_id,

                'destination_section_id' => $data['destination_section_id'],
                'addressee' => $data['addressee'],

                'created_by' => $employee->employee_id,

                /*
                * Copied from the sending section now, so the printed
                * slip is unchanged if the section is recoded later.
                */
                'office_code' => $employee->section?->section_code,
            ]);

            $this->generateQrCode($document);

            return $document->fresh();
        });
    }

    /**
     * Step 2 - fill in a referral's details.
     *
     * Records who completed them and when, so the two halves of the
     * work are both attributable. Any routing field that step 1 did
     * not set is accepted here too, for referrals created by the
     * earlier draft flow.
     */
    public function completeDetails(
        Document $document,
        array $data,
        $employee
    ): Document {
        $update = [
            'concern' => $this->joinChoices(
                $data['concerns'],
                $data['concern_other'] ?? null
            ),

            'referred_for' => $this->joinChoices(
                $data['referred_for'],
                $data['referred_for_other'] ?? null
            ),

            'remarks' => $data['remarks'] === 'Other'
                ? trim($data['remarks_other'])
                : $data['remarks'],

            'details_completed_at' => now(),
            'details_completed_by' => $employee->employee_id,
        ];

        /*
        * Catching up a referral the draft flow left bare.
        */
        foreach (['taxpayer_name', 'document_date', 'destination_section_id', 'addressee'] as $field) {
            if (blank($document->{$field}) && filled($data[$field] ?? null)) {
                $update[$field] = $data[$field];
            }
        }

        $document->update($update);

        return $document->fresh();
    }
}
