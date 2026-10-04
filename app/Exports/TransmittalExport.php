<?php

namespace App\Exports;

use App\Models\Document;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithTitle;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

/**
 * The transmittal, as a spreadsheet.
 *
 * The same set the printed sheet lists - what this section has in
 * transit - but a file somebody can total, sort and keep.
 *
 * "To" is read off each row rather than passed in. One export can cover
 * every destination at once, so there is no single receiving section to
 * stamp on the sheet; writing one in would label every row with the same
 * office regardless of where it is actually going.
 *
 * No employee's name appears anywhere in here. The file leaves the
 * system - it gets emailed, copied and kept - and the office asked for
 * names to stay inside the section that owns them. Sections only.
 */
class TransmittalExport implements FromCollection, ShouldAutoSize, WithHeadings, WithMapping, WithStyles, WithTitle
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
        return [
            'No.',
            'Tracking Number',
            'Taxpayer',
            'Details',
            'From',
            'To',

            /*
            * Registered is the column the date filter acts on, so the
            * two cannot disagree. Waiting Since is shown beside it
            * because it is the one that matters for how late something
            * is - it restarts every time a document is forwarded, which
            * is why it cannot be the one filtered in SQL.
            */
            'Registered',
            'Waiting Since',
        ];
    }

    public function map($document): array
    {
        return [
            ++$this->row,
            data_get($document, 'tracking_number'),
            data_get($document, 'taxpayer_name') ?? 'No taxpayer on record',
            data_get($document, 'concern') ?? '',
            $this->fromSection,
            $this->sectionLabel($document),
            $this->stamp(data_get($document, 'created_at')),
            $this->stamp(data_get($document, 'waiting_since')),
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

    /**
     * Where this row is going - its own destination, not a shared one.
     *
     * Both spellings, because map() is handed the model, where the
     * relation is destinationSection, and a test or a cached row may
     * hand over the serialised array, where it is destination_section.
     * Reading only the snake_case key off a model returns null: the
     * relation is renamed on serialisation, not on the model.
     */
    private function sectionLabel(Document|array $document): string
    {
        $section = data_get($document, 'destinationSection')
            ?? data_get($document, 'destination_section');

        return data_get($section, 'description')
            ?: data_get($section, 'section_name')
            ?: '';
    }

    private function stamp(mixed $value): string
    {
        return $value
            ? Carbon::parse($value)->timezone(config('app.timezone'))->format('M d, Y h:i A')
            : '';
    }
}
