<?php

namespace App\Exports;

use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithTitle;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class ReferralsExport implements FromCollection, WithHeadings, WithMapping, ShouldAutoSize, WithStyles, WithTitle
{
    private int $row = 0;

    public function __construct(private Collection $documents) {}

    public function collection(): Collection
    {
        return $this->documents;
    }

    public function headings(): array
    {
        return ['No.', 'Tracking Number', 'Taxpayer', 'Concern', 'Registered', 'To', 'Status'];
    }

    public function map($document): array
    {
        $taxpayer = trim((string) $document->taxpayer_name);

        return [
            ++$this->row,
            $document->tracking_number,
            $taxpayer !== ''
                ? $taxpayer
                : ($document->concern ?: ($document->transaction_type ?: 'No taxpayer on record')),
            $document->concern ?: ($document->transaction_type ?? ''),
            $document->created_at
                ? Carbon::parse($document->created_at)->timezone(config('app.timezone'))->format('M d, Y h:i A')
                : '',
            $document->destinationSection?->section_name ?? '',
            $this->status($document),
        ];
    }

    public function styles(Worksheet $sheet): array
    {
        return [1 => ['font' => ['bold' => true]]];
    }

    public function title(): string
    {
        return 'Referrals';
    }

    private function status($document): string
    {
        if ($document->deletion_approved_at) {
            return 'Deleted';
        }

        if ($document->completed_at) {
            return 'Completed';
        }

        if ($document->details_completed_at) {
            return 'Slip ready';
        }

        return 'Waiting for details';
    }
}