<?php

namespace App\Http\Middleware;

use App\Models\DocumentComment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Inertia\Middleware;

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
    public function share(Request $request): array
    {
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
            * Notes addressed to this section that nobody has marked as
            * read yet, for the count on the sidebar. One indexed count,
            * and only while an employee is signed in.
            */
            'unreadComments' => fn () => $employee
                ? DocumentComment::query()
                    ->where('to_section_id', $employee->section_id)
                    ->whereNull('acknowledged_at')
                    ->count()
                : 0,

            'auth' => [
                'user' => $request->user(),

                'employee' => $employee
                    ? [
                        'employee_id' => $employee->employee_id,
                        'username' => $employee->username,
                        'section_id' => $employee->section_id,
                        'section_name' => $employee->section?->section_name,
                    ]
                    : null,
            ],
        ];
    }
}
