<?php

namespace App\Listeners;

use App\Models\AuditLog;
use App\Models\EmployeeAcc;
use Illuminate\Auth\Events\Failed;
use Illuminate\Auth\Events\Login;
use Illuminate\Auth\Events\Logout;

/**
 * Signing in and out, recorded.
 *
 * Hung off Laravel's own auth events rather than the login controller,
 * so it catches every path into the system - including any added later
 * by somebody who has never read this file. That is the point: an audit
 * log with a way round it is not one.
 *
 * Failed attempts matter as much as successful ones. A run of them
 * against the same username at three in the morning is the only warning
 * anybody gets that somebody is guessing passwords, and until now
 * nothing anywhere recorded it.
 *
 * The methods are named on* rather than handle*: Laravel discovers and
 * registers any handle* method in this folder that type-hints an event,
 * which together with the explicit registration in AppServiceProvider
 * meant every failed attempt was written down twice - on the one table
 * whose job is to show a run of them.
 */
class RecordAuthenticationActivity
{
    public function onLogin(Login $event): void
    {
        $user = $event->user;

        AuditLog::record('login', null, ['guard' => $event->guard], $user);

        /*
        * last_login has been on employees_acc since the first migration
        * and nothing has ever written to it - it is null on every
        * account. "When did this person last sign in" is a question the
        * office will ask the first time somebody leaves.
        */
        if ($user instanceof EmployeeAcc) {
            $user->forceFill(['last_login' => now()])->saveQuietly();
        }
    }

    public function onLogout(Logout $event): void
    {
        /*
        * Laravel fires this for a guard being cleared as well as for
        * somebody pressing Log out - and signing in now clears the other
        * guard deliberately. Only record a guard that actually held
        * somebody.
        */
        if (! $event->user) {
            return;
        }

        AuditLog::record('logout', null, ['guard' => $event->guard], $event->user);
    }

    public function onFailed(Failed $event): void
    {
        $credentials = $event->credentials ?? [];

        AuditLog::recordAnonymous('login.failed', [
            'guard' => $event->guard,

            /*
            * What they typed in the name field, never what they typed in
            * the password field - not even a wrong one. A log of failed
            * passwords is a log of passwords, since most failures are
            * somebody's real password with a typo.
            */
            'tried' => $credentials['username'] ?? $credentials['email'] ?? null,

            /*
            * Whether the account exists at all. The login screen will
            * not say, and should not - but the log is read by the
            * administrator, who needs to tell a locked-out clerk from
            * somebody guessing at names.
            */
            'account_exists' => $event->user !== null,
        ]);
    }
}
