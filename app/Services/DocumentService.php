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
}