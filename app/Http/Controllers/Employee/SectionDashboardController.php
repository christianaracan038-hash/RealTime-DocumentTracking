<?php

namespace App\Http\Controllers\Employee;

use App\Http\Controllers\Controller;
use App\Models\Document;
use App\Services\DocumentService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class SectionDashboardController extends Controller
{
    public function index(
        Request $request,
        DocumentService $documentService
    ): Response {
        $employee = Auth::guard('employee')->user();

        $search = $request->string('search')->toString();

        $incoming = fn () => Document::query()
            ->with([
                'status',
                'currentSection',
                'destinationSection',
                'creator.section',
                'latestTrackingHistory',
                'comments.author',
            ])
            ->where('destination_section_id', $employee->section_id)
            ->whereIn('status_id', [1, 5])
            ->latest('created_at');

        $all = $incoming()->get();

        $documents = filled($search)
            ? $incoming()
                ->when(
                    true,
                    fn ($query) => $documentService->applySearch($query, $search)
                )
                ->get()
            : $all;

        return Inertia::render(
            $request->route()->defaults['page'],
            [
                'documents' => $documents,

                'filters' => [
                    'search' => $search,
                ],

                'stats' => [
                    'waiting' => $all->count(),

                    'onDesk' => Document::query()
                        ->where('current_employee_id', $employee->employee_id)
                        ->where('status_id', 2)
                        ->count(),

                    'overdue' => $all
                        ->filter(fn (Document $document) => $document->aging['overdue'] ?? false)
                        ->count(),
                ],
            ]
        );
    }
}