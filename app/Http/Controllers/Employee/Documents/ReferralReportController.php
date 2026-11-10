<?php

namespace App\Http\Controllers\Employee\Documents;

use App\Exports\ReferralsExport;
use App\Http\Controllers\Controller;
use App\Models\Document;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Maatwebsite\Excel\Facades\Excel;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class ReferralReportController extends Controller
{
    public function export(Request $request): BinaryFileResponse
    {
        $employee = Auth::guard('employee')->user();

        $validated = $request->validate([
            'from' => ['nullable', 'date'],
            'until' => ['nullable', 'date', 'after_or_equal:from'],
        ]);

        $from = isset($validated['from']) ? Carbon::parse($validated['from'])->startOfDay() : null;
        $until = isset($validated['until']) ? Carbon::parse($validated['until'])->endOfDay() : null;

        $documents = Document::query()
            ->visibleTo($employee)
            ->when($from, fn (Builder $query) => $query->where('created_at', '>=', $from))
            ->when($until, fn (Builder $query) => $query->where('created_at', '<=', $until))
            ->with(['destinationSection'])
            ->oldest('created_at')
            ->get();

        $filename = sprintf(
            'referrals-%s-%s-to-%s.xlsx',
            Str::slug($employee->section?->section_code ?: $employee->section?->section_name ?: 'section'),
            $from?->format('Y-m-d') ?? 'start',
            $until?->format('Y-m-d') ?? now()->format('Y-m-d'),
        );

        return Excel::download(new ReferralsExport($documents), $filename);
    }
}