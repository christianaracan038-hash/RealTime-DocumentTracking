<?php

namespace Tests\Feature\Auth;

use App\Models\EmployeeAcc;
use App\Models\Role;
use App\Models\Section;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;
use Tests\TestCase;

/**
 * Deactivating an account has to actually revoke access.
 *
 * is_active existed on employees_acc from the start and was checked
 * nowhere, so switching somebody off did nothing at all. It is the only
 * mechanism for somebody who resigns, transfers out, or is suspended -
 * the alternative being to delete the account, which would take their
 * movement history and comments with it.
 */
class DeactivatedAccountTest extends TestCase
{
    use RefreshDatabase;

    protected EmployeeAcc $employee;

    protected function setUp(): void
    {
        parent::setUp();

        $section = Section::create([
            'section_code' => '1002',
            'section_name' => 'RDO',
            'is_active' => true,
        ]);

        $this->employee = EmployeeAcc::create([
            'username' => 'rdo.staff',
            'password' => 'correct-horse',
            'section_id' => $section->section_id,
            'role_id' => Role::create(['role_name' => 'Staff', 'is_active' => true])->role_id,
            'is_active' => true,
        ]);
    }

    public function test_an_active_employee_can_sign_in(): void
    {
        $this->post(route('login'), [
            'login' => 'rdo.staff',
            'password' => 'correct-horse',
        ])->assertSessionHasNoErrors();

        $this->assertTrue(Auth::guard('employee')->check());
    }

    public function test_a_deactivated_employee_cannot_sign_in(): void
    {
        $this->employee->update(['is_active' => false]);

        $this->post(route('login'), [
            'login' => 'rdo.staff',
            'password' => 'correct-horse',
        ])->assertSessionHasErrors('login');

        $this->assertFalse(Auth::guard('employee')->check());
    }

    public function test_a_deactivated_account_is_told_why(): void
    {
        $this->employee->update(['is_active' => false]);

        $this->post(route('login'), [
            'login' => 'rdo.staff',
            'password' => 'correct-horse',
        ])->assertSessionHasErrors([
            'login' => 'This account has been deactivated. Please ask your administrator.',
        ]);
    }

    public function test_a_wrong_password_never_reveals_that_the_account_exists(): void
    {
        $this->employee->update(['is_active' => false]);

        /*
         * The same message a made-up username gets. Somebody guessing
         * must not learn that rdo.staff is real, let alone that it is
         * switched off.
         */
        $this->post(route('login'), [
            'login' => 'rdo.staff',
            'password' => 'guessing',
        ])->assertSessionHasErrors(['login' => trans('auth.failed')]);

        $this->flushSession();

        $this->post(route('login'), [
            'login' => 'nobody.here',
            'password' => 'guessing',
        ])->assertSessionHasErrors(['login' => trans('auth.failed')]);
    }

    public function test_a_deactivated_administrator_cannot_sign_in(): void
    {
        $admin = User::create([
            'name' => 'Office Administrator',
            'email' => 'admin@rdo111.test',
            'password' => 'correct-horse',
            'is_active' => false,
        ]);

        $this->post(route('login'), [
            'login' => $admin->email,
            'password' => 'correct-horse',
        ])->assertSessionHasErrors('login');

        $this->assertFalse(Auth::guard('web')->check());

        // And works again once reinstated.
        $admin->update(['is_active' => true]);

        $this->post(route('login'), [
            'login' => $admin->email,
            'password' => 'correct-horse',
        ])->assertSessionHasNoErrors();

        $this->assertTrue(Auth::guard('web')->check());
    }

    public function test_the_session_dumping_debug_route_is_gone(): void
    {
        $this->get('/test-web-auth')->assertNotFound();
    }
}
