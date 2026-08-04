<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class CheckEmployeeSection
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next, string $section): Response
    {
        $employee = Auth::guard('employee')->user();

        if (! $employee) {
            abort(401);
        }

       if ($employee->section?->section_name !== $section) {
            abort(403, 'Unauthorized section.');
        }

        return $next($request);
    }
}