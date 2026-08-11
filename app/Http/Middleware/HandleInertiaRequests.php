<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;
use Illuminate\Support\Facades\Auth;

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

            'auth' => [
                'user' => $request->user(),

                'employee' => $employee
                    ? [
                        'employee_id' => $employee->employee_id,
                        'employee_name' => $employee->employee_name,
                        'section_id' => $employee->section_id,
                        'section_name' => $employee->section?->section_name,
                    ]
                    : null,
            ],
        ];
    }
}
