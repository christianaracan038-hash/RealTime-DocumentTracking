<?php

namespace App\Http\Middleware;

use App\Models\Section;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Middleware;
use App\Models\EmployeeAcc;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    /**
     * Both sidebar counts, in one query, computed once per request.
     */
    protected ?array $badges = null;

    protected function badges($employee): array
    {
        if ($this->badges !== null) {
            return $this->badges;
        }

        if (! $employee) {
            return $this->badges = ['unread' => 0, 'awaiting' => 0];
        }

        $row = DB::selectOne(
            'select
                (select count(*) from document_comments
                    where to_section_id = ? and acknowledged_at is null) as unread,
                (select count(*) from documents
                    where current_section_id = ? and details_completed_at is null) as awaiting',
            [$employee->section_id, $employee->section_id]
        );

        return $this->badges = [
            'unread' => (int) ($row->unread ?? 0),
            'awaiting' => (int) ($row->awaiting ?? 0),
        ];
    }

    public function share(Request $request): array
    {

        /** @var \App\Models\EmployeeAcc|null $employee */
        $employee = Auth::guard('employee')->user();
        return [
            ...parent::share($request),

            'flash' => [
                'success' => fn () => $request->session()->get('success'),

                /*
                * Changes on every flash, so the frontend can tell a new
                * message from the same one still sitting in props.
                */
                'id' => fn () => $request->session()->get('success')
                    ? (string) Str::uuid()
                    : null,
            ],

            /*
            * Only the logo files that exist. Without this the browser
            * requests each one and logs a 404 until they are uploaded.
            */
            'logos' => fn () => collect([
                'bir' => 'images/bir-logo.png',
                'office' => 'images/office-logo.png',
            ])
                ->filter(fn ($path) => file_exists(public_path($path)))
                ->map(fn ($path) => '/'.$path)
                ->all(),

            /*
            * Photograph behind the sign-in screen, if it has been added.
            */
            'backgroundImage' => fn () => file_exists(public_path('images/login-bg.jpg'))
                ? '/images/login-bg.jpg'
                : null,

            /*
            * The two sidebar badges: notes addressed to this section that
            * nobody has read, and arrivals still waiting for their
            * details.
            *
            * One round trip for both. They are counts on different
            * tables, but the database is in Tokyo and every query costs
            * about 290ms of network - so two separate counts spent more
            * time on the wire than on the work. Both halves are covered
            * by an index.
            *
            * awaitingDetailsCount is not called 'awaitingDetails': the
            * referrals page sends a list under that key, and a page prop
            * wins over a shared one.
            */
            'unreadComments' => fn () => $this->badges($employee)['unread'],

            'awaitingDetailsCount' => fn () => $this->badges($employee)['awaiting'],

            'auth' => [
                'user' => $request->user(),

                'employee' => $employee
                    ? [
                        'employee_id' => $employee->employee_id,
                        'username' => $employee->username,
                        'section_id' => $employee->section_id,
                        'section_name' => Section::cached($employee->section_id)?->section_name,

                        /*
                        * Your own name and title - "Atty. John Dela
                        * Cruz" - so the portal can say who is signed in
                        * rather than showing a username back at them.
                        */
                        'display_name' => $employee->display_name,
                        'short_name' => $employee->short_name,
                        'position' => $employee->position,
                        'avatar_url' => $employee->avatar_url,

                        /*
                        * A counter account gets the registration desk in
                        * place of the rest of the portal.
                        */
                        'registers_only' => $employee->registersOnly(),

                        'can_archive' => $employee->canAccessArchive(),
                    ]
                    : null,
            ],
        ];
    }
}
