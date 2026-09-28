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
}
