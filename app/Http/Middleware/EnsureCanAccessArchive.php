<?php

namespace App\Http\Middleware;

use App\Models\EmployeeAcc;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class EnsureCanAccessArchive
{
    public function handle(Request $request, Closure $next): Response
    {
        $employee = Auth::guard('employee')->user();

        abort_unless($employee instanceof EmployeeAcc && $employee->canAccessArchive(), 403);

        return $next($request);
    }
}