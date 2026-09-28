<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

/**
 * Keeps a counter account on the registration desk.
 *
 * The account that registers arrivals has one job, and at the counter
 * there is no time to read anything else. Rather than hiding the rest of
 * the portal in the sidebar and letting a typed address through, every
 * other employee page sends it back to the desk.
 *
 * A redirect rather than a 403: this is not a security boundary - the
 * counter is allowed to register referrals, it simply has nothing to do
 * anywhere else - and a forbidden page in front of a clerk with a queue
 * of taxpayers is no help to anyone.
 */
class RestrictRegistrationDesk
{
    /**
     * Routes a counter account may reach.
     */
    protected array $allowed = [
        'registration.index',
        'documents.store',
        'documents.qr',
        'logout',
    ];

    public function handle(Request $request, Closure $next): Response
    {
        $employee = Auth::guard('employee')->user();

        if (! $employee?->registersOnly()) {
            return $next($request);
        }

        if ($request->routeIs($this->allowed)) {
            return $next($request);
        }

        return redirect()->route('registration.index');
    }
}
