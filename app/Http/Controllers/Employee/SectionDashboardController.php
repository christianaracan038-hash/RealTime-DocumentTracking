<?php

namespace App\Http\Controllers\Employee;

use App\Http\Controllers\Controller;
use App\Models\Document;
use App\Models\Section;
use App\Services\DocumentService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Dashboard for every section - the section's home screen.
 *
 * It answers both halves of a clerk's day in one place: what has been
 * sent to us and needs receiving, and what we have sent out. Registering
 * a referral happens here too, so there is no separate page to find.
 *
 * Each section's route is registered from config/section.php and carries
 * the page component to render as a route default, so one controller
 * serves every section. The section middleware has already confirmed the
 * employee belongs here.
 */
class SectionDashboardController extends Controller
{
    public function index(
        Request $request,
        DocumentService $documentService
    ): Response {
        $employee = Auth::guard('employee')->user();

        $search = $request->string('search')->toString();

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
            ])
            ->where('destination_section_id', $employee->section_id)
            ->where('status_id', 1)
            ->latest('created_at')
            ->get();

        return Inertia::render(
            $request->route()->defaults['page'],
            [
                'documents' => $documents,

                /*
                * Referrals this employee registered, newest first, with
                * the slip available on each row.
                */
                'referrals' => $documentService->getRegisteredDocuments(
                    $employee,
                    $search
                ),

                /*
                * Everything the registration dialog needs. A referral
                * cannot be addressed to the section sending it.
                */
                'sections' => Section::query()
                    ->where('section_id', '!=', $employee->section_id)
                    ->orderBy('section_name')
                    ->get([
                        'section_id',
                        'section_name',
                        'section_code',
                        'description',
                    ]),

                'referralOptions' => config('referral'),

                'fromSection' => $employee->section?->only([
                    'section_id',
                    'section_name',
                    'section_code',
                    'description',
                ]),

                'filters' => [
                    'search' => $search,
                ],
            ]
        );
    }
}
