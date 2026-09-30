<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Reading the audit log.
 *
 * Read-only, and there is deliberately no way to delete from it: the
 * model refuses updates and deletes outright. An administrator who can
 * tidy the record of what administrators did has made the record
 * worthless.
 *
 * Newest first, filtered by what happened or by who did it, because the
 * two questions anybody actually arrives with are "what happened to this
 * account" and "who has been failing to sign in".
 */
class AuditLogController extends Controller
{
    /**
     * The groups offered as filters, and what each covers.
     */
    protected const GROUPS = [
        'login' => ['login', 'logout'],
        'failed' => ['login.failed'],
        'employees' => [
            'employee.created', 'employee.updated', 'employee.password_reset',
            'employee.deactivated', 'employee.reactivated',
            'employee.photo_set', 'employee.photo_removed',
        ],
        'administrators' => [
            'administrator.created', 'administrator.updated',
            'administrator.password_reset',
            'administrator.deactivated', 'administrator.reactivated',
        ],
    ];

    public function index(Request $request): Response
    {
        $group = $request->string('group')->toString();

        $search = $request->string('search')->toString();

        $entries = AuditLog::query()
            ->when(
                isset(self::GROUPS[$group]),
                fn ($query) => $query->whereIn('action', self::GROUPS[$group])
            )
            ->when(filled($search), function ($query) use ($search) {
                $keyword = '%'.strtolower($search).'%';

                $query->where(function ($query) use ($keyword) {
                    $query->whereRaw('lower(actor_label) like ?', [$keyword])
                        ->orWhereRaw('lower(subject_label) like ?', [$keyword])
                        ->orWhereRaw('lower(action) like ?', [$keyword]);
                });
            })
            ->latest('created_at')
            ->latest('audit_log_id')
            ->paginate(40)
            ->withQueryString();

        return Inertia::render('SuperAdmin/Audit/Index', [
            'entries' => $entries,

            'filters' => [
                'group' => $group,
                'search' => $search,
            ],

            /*
            * Counted over the whole log rather than the page, and only
            * for the last week - "three failed sign-ins" is worth
            * knowing; "three failed sign-ins since March" is not.
            */
            'recentFailures' => AuditLog::query()
                ->where('action', 'login.failed')
                ->where('created_at', '>=', now()->subWeek())
                ->count(),

            'total' => AuditLog::count(),
        ]);
    }
}
