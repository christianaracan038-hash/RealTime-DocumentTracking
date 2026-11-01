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

class TransmittalController extends Controller
{
    public function index(Request $request): Response
    {
        $employee = Auth::guard('employee')->user();

        $toSectionId = $request->integer('to') ?: null;

        $inTransit = fn () => $this->inTransit($employee);

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

            'releasedBy' => $employee->display_name,

            'filters' => ['to' => $toSectionId],
        ]);
    }

    public function export(Request $request): BinaryFileResponse
    {
        $employee = Auth::guard('employee')->user();

        $validated = $request->validate([
            'from' => ['nullable', 'date'],
            'until' => ['nullable', 'date', 'after_or_equal:from'],
        ]);

        $from = isset($validated['from']) ? Carbon::parse($validated['from'])->startOfDay() : null;
        $until = isset($validated['until']) ? Carbon::parse($validated['until'])->endOfDay() : null;

        $documents = $this->registered($employee)
            ->when($from, fn (Builder $query) => $query->where('created_at', '>=', $from))
            ->when($until, fn (Builder $query) => $query->where('created_at', '<=', $until))
            ->with(['destinationSection', 'creator.section', 'latestTrackingHistory'])
            ->orderBy('destination_section_id')
            ->oldest('created_at')
            ->get();

        $filename = sprintf(
            'report-%s-%s-to-%s.xlsx',
            Str::slug($employee->section?->section_code ?: $employee->section?->section_name ?: 'section'),
            $from?->format('Y-m-d') ?? 'start',
            $until?->format('Y-m-d') ?? now()->format('Y-m-d'),
        );

        return Excel::download(
            new TransmittalExport(
                $documents,
                $employee->section?->section_name ?? '',
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

    private function registered($employee): Builder
    {
        return Document::query()
            ->whereHas('creator', fn (Builder $creator) => $creator->where('section_id', $employee->section_id));
    }
}