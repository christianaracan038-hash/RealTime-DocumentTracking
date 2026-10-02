<?php

namespace App\Http\Controllers\Employee\Documents;

use App\Exports\TransmittalExport;
use App\Http\Controllers\Controller;
use App\Models\Document;
use App\Models\Section;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Maatwebsite\Excel\Facades\Excel;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

/**
 * The transmittal sheet - the paper that goes with a stack of documents.
 *
 * The system already records receipt the moment somebody scans a QR
 * code. This is for the minute before that: a runner carries five
 * dockets to the Admin Section, hands them over, and wants a signature
 * saying they were handed over. The office has always kept that as a
 * logbook, and a system that cannot produce one just means they keep
 * writing the logbook by hand beside it.
 *
 * What it lists is what is genuinely in transit from this section to
 * another: forwarded or addressed there, and not yet received. That set
 * needs no choosing - the office is handing over exactly the documents
 * the system says are on their way.
 */
class TransmittalController extends Controller
{
    public function index(Request $request): Response
    {
        $employee = Auth::guard('employee')->user();

        $toSectionId = $request->integer('to') ?: null;

        /*
        * In transit from us to them: still Pending, still sitting with
        * this section, addressed somewhere else. Once the receiving
        * section scans it the row changes hands and drops off this
        * sheet, which is the behaviour you want - a transmittal should
        * only ever list what has not been received yet.
        */
        $inTransit = fn () => $this->inTransit($employee);

        /*
        * Every section we have something waiting for, with a count -
        * so the choice of destination is made from what is actually
        * there rather than from a list of every section in the office.
        */
        $waiting = $inTransit()
            ->selectRaw('destination_section_id, count(*) as total')
            ->groupBy('destination_section_id')
            ->pluck('total', 'destination_section_id');

        $destinations = Section::query()
            ->whereIn('section_id', $waiting->keys())
            ->orderBy('section_name')
            ->get(['section_id', 'section_name', 'section_code', 'description'])
            ->map(fn (Section $section) => [
                ...$section->only(['section_id', 'section_name', 'section_code', 'description']),
                'waiting' => (int) $waiting[$section->section_id],
            ])
            ->values();

        /*
        * Nothing chosen yet: open on whichever section has the most
        * waiting, since that is almost always the one being walked over.
        */
        $toSectionId ??= $destinations->sortByDesc('waiting')->first()['section_id'] ?? null;

        $documents = $toSectionId
            ? $inTransit()
                ->where('destination_section_id', $toSectionId)
                ->with(['destinationSection', 'creator.section', 'latestTrackingHistory'])
                ->oldest('created_at')
                ->get()
            : collect();

        return Inertia::render('Employees/Transmittal/Index', [
            'documents' => $documents,

            'destinations' => $destinations,

            'toSection' => $toSectionId
                ? Section::cached($toSectionId)?->only([
                    'section_id', 'section_name', 'section_code', 'description',
                ])
                : null,

            'fromSection' => $employee->section?->only([
                'section_id', 'section_name', 'section_code', 'description',
            ]),

            /*
            * Printed on the sheet as who released it, so the receiving
            * section knows who to go back to.
            */
            'releasedBy' => $employee->display_name,

            'filters' => ['to' => $toSectionId],
        ]);
    }

    public function export(Request $request): BinaryFileResponse
    {
        $employee = Auth::guard('employee')->user();

        $validated = $request->validate([
            'to' => ['nullable', 'integer', 'exists:sections,section_id'],
            'from' => ['nullable', 'date'],
            'until' => ['nullable', 'date', 'after_or_equal:from'],
        ]);

        $toSectionId = $validated['to'] ?? null;
        $from = isset($validated['from']) ? Carbon::parse($validated['from'])->startOfDay() : null;
        $until = isset($validated['until']) ? Carbon::parse($validated['until'])->endOfDay() : null;

        $documents = $this->inTransit($employee)
            ->when($toSectionId, fn (Builder $query) => $query->where('destination_section_id', $toSectionId))
            ->when($from, fn (Builder $query) => $query->where('created_at', '>=', $from))
            ->when($until, fn (Builder $query) => $query->where('created_at', '<=', $until))
            ->with(['destinationSection', 'creator.section', 'latestTrackingHistory'])
            ->orderBy('destination_section_id')
            ->oldest('created_at')
            ->get();

        $toSection = $toSectionId ? Section::cached($toSectionId) : null;

        $filename = sprintf(
            'transmittal-%s-%s-to-%s.xlsx',
            Str::slug($toSection?->section_code ?: $toSection?->section_name ?: 'all-sections'),
            $from?->format('Y-m-d') ?? 'start',
            $until?->format('Y-m-d') ?? now()->format('Y-m-d'),
        );

        return Excel::download(
            new TransmittalExport(
                $documents,
                $employee->section?->section_name ?? '',
                $employee->display_name ?? '',
            ),
            $filename,
        );
    }

    private function inTransit($employee): Builder
    {
        return Document::query()
            ->where('status_id', 1)
            ->where('current_section_id', $employee->section_id)
            ->whereNotNull('destination_section_id')
            ->where('destination_section_id', '!=', $employee->section_id);
    }
}