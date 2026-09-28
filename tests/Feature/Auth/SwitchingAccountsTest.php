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
 * Signing in as somebody else at the same browser.
 *
 * Two guards share one session, and signing in never cleared the other
 * one. An administrator signing in where an employee had been working
 * ended up signed in as both, and - because the employee guard was
 * consulted first - was sent to that section's dashboard instead of the
 * super admin area.
 */
class SwitchingAccountsTest extends TestCase
{
    use RefreshDatabase;

    protected User $superAdmin;

    protected EmployeeAcc $employee;

    protected function setUp(): void
    {
        parent::setUp();

        $this->superAdmin = User::factory()->create([
            'email' => 'super@rdo111.test',
            'password' => 'admin-password',
        ]);

        $section = Section::create([
            'section_code' => '1002',
            'section_name' => 'RDO',
            'is_active' => true,
        ]);

        $this->employee = EmployeeAcc::create([
            'username' => 'rdo.staff',
            'password' => 'staff-password',
            'section_id' => $section->section_id,
            'role_id' => Role::create(['role_name' => 'Staff', 'is_active' => true])->role_id,
            'is_active' => true,
        ]);
    }

    protected function signInAsEmployee(): void
    {
        $this->post(route('login'), [
            'login' => 'rdo.staff',
            'password' => 'staff-password',
        ])->assertSessionHasNoErrors();
    }

    protected function signInAsSuperAdmin(): void
    {
        $this->post(route('login'), [
            'login' => 'super@rdo111.test',
            'password' => 'admin-password',
        ])->assertSessionHasNoErrors();
    }

    public function test_an_administrator_signing_in_after_an_employee_reaches_the_super_admin_area(): void
    {
        $this->signInAsEmployee();

        $this->post(route('login'), [
            'login' => 'super@rdo111.test',
            'password' => 'admin-password',
        ])->assertRedirect(route('super.dashboard'));
    }

    public function test_the_employee_session_is_not_left_behind(): void
    {
        $this->signInAsEmployee();

        $this->signInAsSuperAdmin();

        // One identity per session, not two.
        $this->assertTrue(Auth::guard('web')->check());
        $this->assertFalse(Auth::guard('employee')->check());
    }

    public function test_an_employee_signing_in_after_an_administrator_reaches_their_dashboard(): void
    {
        $this->signInAsSuperAdmin();

        $this->post(route('login'), [
            'login' => 'rdo.staff',
            'password' => 'staff-password',
        ])->assertRedirect(route('rdo.dashboard'));

        $this->assertTrue(Auth::guard('employee')->check());
        $this->assertFalse(Auth::guard('web')->check());
    }

    public function test_the_super_admin_area_is_reachable_after_switching(): void
    {
        $this->signInAsEmployee();

        $this->signInAsSuperAdmin();

        $this->get(route('super.dashboard'))->assertOk();
    }

    public function test_the_employee_portal_is_closed_after_switching_to_an_administrator(): void
    {
        $this->signInAsEmployee();

        $this->signInAsSuperAdmin();

        /*
         * Otherwise the administrator would still be carrying the
         * employee's access to that section's documents.
         */
        $this->get(route('rdo.dashboard'))->assertRedirect(route('login'));
    }
}
