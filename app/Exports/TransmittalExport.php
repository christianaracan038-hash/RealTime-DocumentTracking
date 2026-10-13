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

class TransmittalExport implements FromCollection, WithHeadings, WithMapping, ShouldAutoSize, WithStyles, WithTitle
{
    private int $row = 0;

    public function __construct(
        private Collection $documents,
        private string $fromSection,
    ) {}

    public function collection(): Collection
    {
        return $this->documents;
    }

    public function headings(): array
    {
        return ['No.', 'Tracking Number', 'Taxpayer', 'Concern', 'From', 'To', 'Waiting Since'];
    }

    public function map($document): array
    {
        $waitingSince = $document->latestTrackingHistory?->tracked_at ?? $document->created_at;

        return [
            ++$this->row,
            $document->tracking_number,
            $document->taxpayer_name ?? 'No taxpayer on record',
            $document->concern ?? '',
            $this->fromSection,
            $document->destinationSection?->section_name ?? '',
            $waitingSince
                ? Carbon::parse($waitingSince)->timezone(config('app.timezone'))->format('M d, Y h:i A')
                : '',
        ];
    }

    public function styles(Worksheet $sheet): array
    {
        return [1 => ['font' => ['bold' => true]]];
    }

    public function title(): string
    {
        return 'Transmittal';
    }
}