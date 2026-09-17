<?php

namespace App\Http\Middleware;

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
