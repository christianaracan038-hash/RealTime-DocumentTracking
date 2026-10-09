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
 * One job: the documents sent to this section that still need
 * receiving. Registering referrals, and the list of referrals the
 * section has sent out, live on the Referrals page.
 *
 * Each section's route is registered from config/section.php and carries
 * the page component to render as a route default, so one controller
 * serves every section. The section middleware has already confirmed the
 * employee belongs here.
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
                'latestTrackingHistory',

                /*
                * Notes the RDO has left about this document, so the
                * section holding it can see why it is being chased.
                */
                'comments.author',
            ])
            ->where('destination_section_id', $employee->section_id)
            ->whereIn('status_id', [1, 5])
            ->latest('created_at')
            ->get();

        return Inertia::render(
            $request->route()->defaults['page'],
            [
                'documents' => $documents,

                /*
                * The three numbers the office reads first thing in the
                * morning. Counted here rather than in the page so the
                * figures are the same ones the lists below are built
                * from.
                */
                'stats' => [
                    'waiting' => $documents->count(),

                    /*
                    * Held by this person, not the section: "on your
                    * desk" is a personal queue, and it is what
                    * documents.index lists.
                    */
                    'onDesk' => Document::query()
                        ->where('current_employee_id', $employee->employee_id)
                        ->where('status_id', 2)
                        ->count(),

                    /*
                    * Read off the aging accessor rather than queried,
                    * because the two-day limit is measured from the last
                    * movement and not from a column.
                    */
                    'overdue' => $documents
                        ->filter(fn (Document $document) => $document->aging['overdue'] ?? false)
                        ->count(),
                ],
            ]
        );
    }
}
