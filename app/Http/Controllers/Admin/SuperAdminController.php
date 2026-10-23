<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\EmployeeAcc;
use App\Models\Role;
use App\Models\Section;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use App\Models\Document;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;


/**
 * Where a super administrator lands.
 *
 * Deliberately not called "admin" anywhere a person can see. The office
 * has an Admin Section that handles referrals exactly like Compliance or
 * CSS, and its staff sign in as employees; this is the account that
 * authorises everybody, including them. Landing on a page headed "Admin"
 * made the two look like the same thing.
 *
 * What it shows is who can get into the system, broken down the way the
 * office thinks about it: by section.
 */
class SuperAdminController extends Controller
{
    public function index(): Response
    {
        $employees = EmployeeAcc::query()
            ->with(['role', 'section'])
            ->get(['employee_id', 'username', 'full_name', 'section_id', 'role_id', 'is_active', 'last_login']);

        return Inertia::render('SuperAdmin/Dashboard', [
            /*
            * One row per section, including the ones with nobody in them
            * - an empty section is worth seeing, since a section whose
            * staff cannot sign in is a section whose documents stop
            * moving.
            */
            'sections' => Section::query()
                ->orderBy('section_name')
                ->get(['section_id', 'section_code', 'section_name', 'description', 'is_active'])
                ->map(function (Section $section) use ($employees) {
                    $ours = $employees->where('section_id', $section->section_id);

                    return [
                        'section_id' => $section->section_id,
                        'section_code' => $section->section_code,
                        'section_name' => $section->section_name,
                        'description' => $section->description,
                        'is_active' => $section->is_active,
                        'accounts' => $ours->count(),
                        'active' => $ours->where('is_active', true)->count(),
                        'unnamed' => $ours->filter(fn ($e) => blank($e->full_name))->count(),

                        /*
                        * Whether anybody from this section has ever
                        * signed in. Null for every account until now,
                        * because nothing wrote last_login - which is the
                        * next thing to fix.
                        */
                        'last_seen' => $ours->max('last_login'),
                    ];
                }),

            'totals' => [
                'employees' => $employees->count(),
                'employees_active' => $employees->where('is_active', true)->count(),
                'employees_unnamed' => $employees->filter(fn ($e) => blank($e->full_name))->count(),
                'administrators' => User::count(),
                'administrators_active' => User::where('is_active', true)->count(),
                'sections' => Section::count(),
                'roles' => Role::count(),
                'pending_deletions' => Document::whereNotNull('deletion_requested_at')
                    ->whereNull('deletion_approved_at')
                    ->count(),
            ],

            /*
            * Accounts with nobody's name against them. Every screen that
            * should say who handled a document says a username instead
            * until these are filled in, so they are listed rather than
            * merely counted.
            */
            'needsNaming' => $employees
                ->filter(fn ($e) => blank($e->full_name))
                ->map(fn ($e) => [
                    'employee_id' => $e->employee_id,
                    'username' => $e->username,
                    'section' => $e->section?->section_name,
                ])
                ->values(),

            'rolesInUse' => DB::table('roles')
                ->leftJoin('employees_acc', 'employees_acc.role_id', '=', 'roles.role_id')
                ->groupBy('roles.role_id', 'roles.role_name')
                ->orderBy('roles.role_name')
                ->get([
                    'roles.role_id',
                    'roles.role_name',
                    DB::raw('count(employees_acc.employee_id) as accounts'),
                ]),
        ]);
    }

    public function deletions(): Response
    {
        $requests = Document::query()
            ->whereNotNull('deletion_requested_at')
            ->whereNull('deletion_approved_at')
            ->with(['creator.section', 'requester'])
            ->latest('deletion_requested_at')
            ->paginate(20);

        return Inertia::render('SuperAdmin/Administrators/Deletions', [
            'requests' => $requests,
        ]);
    }

    public function approveDeletion(Document $document): RedirectResponse
    {
        abort_if($document->deletion_requested_at === null, 422, 'No deletion request on this referral.');
        abort_if($document->deletion_approved_at !== null, 422, 'Already approved.');

        $document->update([
            'deletion_approved_at' => now(),
            'deletion_approved_by' => Auth::id(),
        ]);

        return back()->with('success', 'Referral marked as deleted.');
    }

    public function rejectDeletion(Document $document): RedirectResponse
    {
        abort_if($document->deletion_requested_at === null, 422, 'No deletion request on this referral.');
        abort_if($document->deletion_approved_at !== null, 422, 'Already approved and cannot be rejected.');

        $document->update([
            'deletion_requested_at' => null,
            'deletion_requested_by' => null,
            'deletion_reason' => null,
        ]);

        return back()->with('success', 'Deletion request rejected.');
    }

    public function deletionHistory(): Response
    {
        $history = Document::query()
            ->select([
                'document_id',
                'tracking_number',
                'deletion_requested_at',
                'deletion_requested_by',
                'deletion_reason',
                'deletion_approved_at',
                'deletion_approved_by',
            ])
            ->whereNotNull('deletion_approved_at')
            ->with([
                'requester:employee_id,username,full_name',
                'approver:id,name',
            ])
            ->latest('deletion_approved_at')
            ->paginate(20)
            ->through(fn (Document $document) => [
                'document_id' => $document->document_id,
                'tracking_number' => $document->tracking_number,
                'deletion_requested_at' => $document->deletion_requested_at,
                'deletion_reason' => $document->deletion_reason,
                'deletion_approved_at' => $document->deletion_approved_at,
                'requested_by' => $document->requester?->full_name
                    ?: $document->requester?->username,
                'approved_by' => $document->approver?->name,
            ]);

        return Inertia::render('SuperAdmin/Administrators/DeletionHistory', [
            'history' => $history,
        ]);
    }
}
