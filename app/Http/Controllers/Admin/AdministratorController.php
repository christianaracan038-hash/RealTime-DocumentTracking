<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\Auth;
/**
 * The administrator accounts themselves.
 *
 * One tier: the office holds an account, and so do the developers until
 * the system is handed over. Every administrator can manage every other
 * one, which is fine for an office this size and dangerous in exactly
 * two ways - so those two are guarded:
 *
 *   - nobody can switch off their own account
 *   - the last active administrator cannot be switched off
 *
 * Without those, one wrong click leaves a live system that nobody can
 * administer, recoverable only by editing the database by hand.
 */
class AdministratorController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('SuperAdmin/Administrators/Index', [
            'administrators' => User::query()
                ->orderBy('is_active', 'desc')
                ->orderBy('name')
                ->get(['id', 'name', 'email', 'is_active', 'created_at']),

            'currentId' => Auth::id(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ], [
            'name.required' => 'Please enter the administrator\'s name.',
            'email.required' => 'Please enter an email address - administrators sign in with one.',
            'email.unique' => 'Another administrator already uses that email address.',
            'password.min' => 'The password must be at least 8 characters.',
            'password.confirmed' => 'The two passwords do not match.',
        ]);

        $created = User::create($validated + ['is_active' => true]);

        /*
        * The entry that matters most in this table: who gave somebody
        * the power to give power.
        */
        AuditLog::record('administrator.created', $created);

        return back()->with('success', $validated['name'].' can now sign in as an administrator.');
    }

    public function update(Request $request, User $user): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => [
                'required', 'email', 'max:255',
                Rule::unique('users', 'email')->ignore($user->id),
            ],
        ], [
            'email.unique' => 'Another administrator already uses that email address.',
        ]);

        $user->fill($validated);

        $changed = array_keys($user->getDirty());

        $user->save();

        AuditLog::record('administrator.updated', $user, ['changed' => $changed]);

        return back()->with('success', $user->name.' updated.');
    }

    public function resetPassword(Request $request, User $user): RedirectResponse
    {
        $validated = $request->validate([
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ], [
            'password.min' => 'The password must be at least 8 characters.',
            'password.confirmed' => 'The two passwords do not match.',
        ]);

        $user->update(['password' => $validated['password']]);

        AuditLog::record('administrator.password_reset', $user);

        return back()->with('success', 'New password set for '.$user->name.'.');
    }

    /**
     * Switch an administrator on or off - the handover mechanism, and how
     * somebody who leaves loses access without losing their audit trail.
     */
    public function setActive(Request $request, User $user): RedirectResponse
    {
        $validated = $request->validate([
            'is_active' => ['required', 'boolean'],
        ]);

        if (! $validated['is_active']) {
            $this->refuseIfLockingEveryoneOut($user);
        }

        $user->update(['is_active' => $validated['is_active']]);

        AuditLog::record(
            $validated['is_active'] ? 'administrator.reactivated' : 'administrator.deactivated',
            $user
        );

        return back()->with(
            'success',
            $validated['is_active']
                ? $user->name.' can sign in again.'
                : $user->name.' can no longer sign in.'
        );
    }

    /**
     * The two ways switching an administrator off goes badly.
     */
    protected function refuseIfLockingEveryoneOut(User $user): void
    {
        if ((int) $user->id === (int) Auth::id()) {
            throw ValidationException::withMessages([
                'is_active' => 'You cannot switch off your own account. Ask another administrator to do it.',
            ]);
        }

        $othersRemaining = User::where('is_active', true)
            ->whereKeyNot($user->id)
            ->count();

        if ($othersRemaining === 0) {
            throw ValidationException::withMessages([
                'is_active' => 'This is the last active administrator. Create another one before switching this off.',
            ]);
        }
    }
}
