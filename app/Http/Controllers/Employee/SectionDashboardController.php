<?php

namespace App\Http\Controllers\Employee;

use App\Http\Controllers\Controller;
use App\Models\Document;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Dashboard for every section.
 *
 * Each section's route is registered from config/section.php and carries
 * the page component to render as a route default, so one controller
 * serves RDO, Assessment, CSS, Collection and Compliance alike. The
 * section middleware has already confirmed the employee belongs here.
 */
class SectionDashboardController extends Controller
{
    public function index(Request $request): Response
    {
        $employee = Auth::guard('employee')->user();

        /*
        * Documents routed to this section and still awaiting receipt.
        * status_id 1 is Pending.
        */
        $documents = Document::query()
            ->with([
                'status',
                'currentSection',
                'destinationSection',
                'creator.section',
            ])
            ->where('destination_section_id', $employee->section_id)
            ->where('status_id', 1)
            ->latest('created_at')
            ->get();

        return Inertia::render(
            $request->route()->defaults['page'],
            [
                'documents' => $documents,
            ]
        );
    }
}
