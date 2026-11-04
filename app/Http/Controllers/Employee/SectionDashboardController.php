<?php

namespace App\Http\Controllers\Employee;

use App\Http\Controllers\Controller;
use App\Models\Document;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class SectionDashboardController extends Controller
{
    public function index(Request $request): Response
    {
        $employee = Auth::guard('employee')->user();

        $search = trim($request->string('search')->toString());

        $documents = Document::query()
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
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($q) use ($search) {
                    $like = '%' . $search . '%';
                    $op = DB::getDriverName() === 'pgsql' ? 'ilike' : 'like';

                    // partial match (hal. "BIR-2026")
                    $q->where('tracking_number', $op, $like)
                        ->orWhere('taxpayer_name', $op, $like)
                        ->orWhere('reference_number', $op, $like)
                        ->orWhere('concern', $op, $like);

                    // full-text match (gumagamit ng GIN index mo)
                    if (DB::getDriverName() === 'pgsql') {
                        $q->orWhereRaw(
                            "to_tsvector('english',
                                coalesce(tracking_number, '') || ' ' ||
                                coalesce(taxpayer_name, '') || ' ' ||
                                coalesce(concern, '') || ' ' ||
                                coalesce(reference_number, '') || ' ' ||
                                coalesce(description, '')
                            ) @@ plainto_tsquery('english', ?)",
                            [$search]
                        );
                    }
                });
            })
            ->latest('created_at')
            ->paginate(10)
            ->withQueryString();   // para hindi mawala ang search kapag lumipat ng page

        return Inertia::render(
            $request->route()->defaults['page'],
            [
                'documents' => $documents->items(),

                'filters' => [
                    'search' => $search,
                ],

                'stats' => [
                    'waiting' => $documents->total(),

                    'onDesk' => Document::query()
                        ->where('current_employee_id', $employee->employee_id)
                        ->where('status_id', 2)
                        ->count(),

                    'overdue' => Document::query()
                        ->overdue($employee->section_id)
                        ->count(),
                ],
            ]
        );
    }
}