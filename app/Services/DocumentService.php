<?php

namespace App\Services;

use App\Models\Document;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use SimpleSoftwareIO\QrCode\Facades\QrCode;
use Illuminate\Support\Facades\Storage;

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

                'taxpayer_name' => $data['taxpayer_name'],

                'document_date' => $data['document_date'],

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

        return 'DOC-' .
            now()->format('Ymd') .
            '-' .
            str_pad($lastId, 6, '0', STR_PAD_LEFT);
    }

    private function generateQrCode(Document $document)
    {
            // QR content
        $qrValue = $document->tracking_number;

        // File name
        $fileName = $qrValue . '.svg';

        // Generate QR SVG
        $qrImage = QrCode::format('svg')
            ->size(300)
            ->margin(2)
            ->generate($qrValue);

        // Save to storage/app/public/qrcodes
        Storage::disk('public')->put(
            'qrcodes/' . $fileName,
            $qrImage
        );

        // Update document
        $document->update([
            'qr_value' => $qrValue,
            'qr_path' => 'storage/qrcodes/' . $fileName,
            'qr_generated_at' => now(),
        ]);

    }


    public function getHistoryDocuments($employee, $search = null)
    {
        return Document::query()
            ->with([
                'status',
                'currentSection',
                'destinationSection',
                'currentEmployee',
                'creator',
                'trackingHistories' => function ($query) {
                    $query->with([
                        'fromSection',
                        'toSection',
                        'employee',
                        'status',
                    ])->orderBy('tracked_at', 'asc');
                },
            ])
            ->where(function ($query) use ($employee) {
                $query->where('created_by', $employee->employee_id)
                    ->orWhere('current_employee_id', $employee->employee_id)
                    ->orWhere('current_section_id', $employee->section_id)
                    ->orWhere('destination_section_id', $employee->section_id)
                    ->orWhereHas('trackingHistories', function ($historyQuery) use ($employee) {
                        $historyQuery->where(function ($query) use ($employee) {
                            $query->where('from_section_id', $employee->section_id)
                                ->orWhere('to_section_id', $employee->section_id);
                        });
                    })
                    ->orWhereHas('trackingHistories', function ($historyQuery) use ($employee) {
                        $historyQuery->where(
                            'employee_id',
                            $employee->employee_id
                        );
                    });
            })
            ->when($search, function ($query) use ($search) {
                $search = trim($search);

                $query->where(function ($query) use ($search) {
                    $query->where(
                        'tracking_number',
                        'like',
                        "%{$search}%"
                    )
                    ->orWhere('taxpayer_name', 'like', "%{$search}%")
                    ->orWhere(
                        'reference_number',
                        'like',
                        "%{$search}%"
                    )
                    ->orWhere(
                        'description',
                        'like',
                        "%{$search}%"
                    )
                    ->orWhereHas('creator', function ($creatorQuery) use ($search) {
                        $creatorQuery->where(
                            'username',
                            'like',
                            "%{$search}%"
                        );
                    })
                    ->orWhereHas('currentSection', function ($sectionQuery) use ($search) {
                        $sectionQuery->where(
                            'section_name',
                            'like',
                            "%{$search}%"
                        );
                    })
                    ->orWhereHas('destinationSection', function ($sectionQuery) use ($search) {
                        $sectionQuery->where(
                            'section_name',
                            'like',
                            "%{$search}%"
                        );
                    })
                    ->orWhereHas('currentEmployee', function ($employeeQuery) use ($search) {
                        $employeeQuery->where(
                            'username',
                            'like',
                            "%{$search}%"
                        );
                    })
                    ->orWhereHas('trackingHistories', function ($historyQuery) use ($search) {
                        $historyQuery->where('action', 'like', "%{$search}%")
                            ->orWhere('remarks', 'like', "%{$search}%")
                            ->orWhereHas('fromSection', function ($sectionQuery) use ($search) {
                                $sectionQuery->where(
                                    'section_name',
                                    'like',
                                    "%{$search}%"
                                );
                            })
                            ->orWhereHas('toSection', function ($sectionQuery) use ($search) {
                                $sectionQuery->where(
                                    'section_name',
                                    'like',
                                    "%{$search}%"
                                );
                            })
                            ->orWhereHas('employee', function ($employeeQuery) use ($search) {
                                $employeeQuery->where(
                                    'username',
                                    'like',
                                    "%{$search}%"
                                );
                            })
                            ->orWhereHas('status', function ($statusQuery) use ($search) {
                                $statusQuery->where(
                                    'status_name',
                                    'like',
                                    "%{$search}%"
                                );
                            });
                    });
                });
            })
            ->latest('created_at')
            ->paginate(3)
            ->withQueryString();
    }
}