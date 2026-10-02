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
        private string $toSection,
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
        $waitingSince = data_get($document, 'waiting_since');

        return [
            ++$this->row,
            data_get($document, 'tracking_number'),
            data_get($document, 'taxpayer_name') ?? 'No taxpayer on record',
            data_get($document, 'concern') ?? '',
            $this->fromSection,
            $this->toSection,
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