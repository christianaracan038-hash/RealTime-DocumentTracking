<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreEmployeeAccountRequest;
use App\Http\Requests\Admin\UpdateEmployeeAccountRequest;
use App\Models\AuditLog;
use App\Models\EmployeeAcc;
use App\Models\Role;
use App\Models\Section;
use App\Services\AvatarStorage;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Employee accounts, managed by the administrator.
 *
 * There is one administrator tier - the office holds the account, and so
 * do the developers until handover. The Admin *Section* is not part of
 * this: it processes referrals like Compliance or CSS, and its staff
 * sign in on the employee guard, which cannot reach these routes at all.
 */
class EmployeeAccountController extends Controller
{
    public function index(Request $request): Response
    {
        $search = $request->string('search')->toString();

        $employees = EmployeeAcc::query()
            ->with(['section', 'role'])
            ->when(filled($search), function ($query) use ($search) {
                $keyword = '%'.strtolower($search).'%';

                $query->where(function ($query) use ($keyword) {
                    $query->whereRaw('lower(username) like ?', [$keyword])
                        ->orWhereRaw('lower(full_name) like ?', [$keyword])
                        ->orWhereRaw('lower(position) like ?', [$keyword])
                        ->orWhereRaw('lower(email) like ?', [$keyword]);
                });
            })
            ->orderBy('is_active', 'desc')
            ->orderBy('username')
            ->get();

        /*
        * The administrator is entitled to every name, so they are asked
        * for here. On the model itself they are hidden and unappended,
        * because an employee is also serialised as the creator of a
        * document or the author of a comment - payloads that go to other
        * sections, which are not entitled to a person's name.
        */
        /*
        * The administrator is entitled to all of it. On the model these
        * are hidden and unappended, because an employee is also
        * serialised as a document's creator or a comment's author -
        * payloads that go to other sections, which are entitled to
        * neither a name nor a face.
        */
        $employees->each->append(['display_name', 'avatar_url']);
        $employees->each->makeVisible(['full_name', 'position', 'email']);

        return Inertia::render('SuperAdmin/Employees/Index', [
            'employees' => $employees,

            /*
            * Every section and role, not just the active ones: an
            * account may already sit on one that was later switched off,
            * and the form has to be able to show what it currently is.
            */
            'sections' => Section::orderBy('section_name')->get(),
            'roles' => Role::orderBy('role_name')->get(),

            'filters' => ['search' => $search],
        ]);
    }

    /*
    * sections() and roles() used to sit here. Both were unrouted -
    * SectionController and RoleController serve those screens - and both
    * still rendered 'Admin/…' page paths that stopped existing when the
    * area was renamed to SuperAdmin. Dead code pointing at deleted
    * files: the worst kind, because it reads as if it works.
    */

    public function store(StoreEmployeeAccountRequest $request): RedirectResponse
    {
        $employee = EmployeeAcc::create($request->validated());

        AuditLog::record('employee.created', $employee, [
            'section_id' => $employee->section_id,
            'role_id' => $employee->role_id,
        ]);

        return back()->with(
            'success',
            $employee->display_name.' can now sign in as '.$employee->username.'.'
        );
    }

    public function update(
        UpdateEmployeeAccountRequest $request,
        EmployeeAcc $employee
    ): RedirectResponse {
        /*
        * What actually changed, not what was submitted - the form posts
        * every field whether or not the administrator touched it, and a
        * log that says "changed everything" on every edit says nothing.
        */
        $employee->fill($request->validated());

        $changed = array_keys($employee->getDirty());

        $employee->save();

        AuditLog::record('employee.updated', $employee, ['changed' => $changed]);

        return back()->with('success', $employee->display_name.' updated.');
    }

    /**
     * Set a new password for somebody who has forgotten theirs.
     *
     * Separate from update() on purpose: there is no email on file to
     * send a reset link to, so the administrator sets it and tells the
     * person. Nothing here reveals the old password, which is hashed and
     * unreadable anyway.
     */
    public function resetPassword(Request $request, EmployeeAcc $employee): RedirectResponse
    {
        $validated = $request->validate([
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ], [
            'password.required' => 'Please enter the new password.',
            'password.min' => 'The password must be at least 8 characters.',
            'password.confirmed' => 'The two passwords do not match.',
        ]);

        $employee->update(['password' => $validated['password']]);

        // The fact of it. Never the password, not even in the context.
        AuditLog::record('employee.password_reset', $employee);

        return back()->with(
            'success',
            'New password set for '.$employee->display_name.'.'
        );
    }

    /**
     * Put a face to an account.
     *
     * Squared off and shrunk to 256px on the way in - these arrive from
     * phone cameras at several megabytes, and an avatar is drawn at
     * forty pixels. See AvatarStorage.
     */
    public function storeAvatar(
        Request $request,
        EmployeeAcc $employee,
        AvatarStorage $avatars
    ): RedirectResponse {
        $request->validate([
            'photo' => [
                'required',
                'image',
                'mimes:jpeg,jpg,png,webp',

                // Generous: this is what a phone camera produces.
                'max:8192',
            ],
        ], [
            'photo.required' => 'Please choose a photograph.',
            'photo.image' => 'That file is not an image.',
            'photo.mimes' => 'Please use a JPEG, PNG or WebP image.',
            'photo.max' => 'That image is larger than 8MB.',
        ]);

        $avatars->store($employee, $request->file('photo'));

        AuditLog::record('employee.photo_set', $employee);

        return back()->with('success', 'Photograph set for '.$employee->display_name.'.');
    }

    public function destroyAvatar(
        EmployeeAcc $employee,
        AvatarStorage $avatars
    ): RedirectResponse {
        $avatars->remove($employee);

        AuditLog::record('employee.photo_removed', $employee);

        return back()->with('success', 'Photograph removed for '.$employee->display_name.'.');
    }

    /**
     * Switch an account on or off.
     *
     * Deactivating is how somebody who resigns, transfers out or is
     * suspended loses access. Deleting would take their movement history
     * and their comments with it, so the account stays and the login
     * stops - see the is_active check in LoginRequest.
     */
    public function setActive(Request $request, EmployeeAcc $employee): RedirectResponse
    {
        $validated = $request->validate([
            'is_active' => ['required', 'boolean'],
        ]);

        $employee->update(['is_active' => $validated['is_active']]);

        AuditLog::record(
            $validated['is_active'] ? 'employee.reactivated' : 'employee.deactivated',
            $employee
        );

        return back()->with(
            'success',
            $validated['is_active']
                ? $employee->display_name.' can sign in again.'
                : $employee->display_name.' can no longer sign in.'
        );
    }
}
