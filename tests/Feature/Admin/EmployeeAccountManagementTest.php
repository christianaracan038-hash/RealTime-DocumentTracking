<?php

namespace Tests\Feature\Admin;

use App\Models\EmployeeAcc;
use App\Models\Role;
use App\Models\Section;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

/**
 * Managing employee accounts.
 *
 * Creating one was all this panel could do: an account could not be
 * corrected, switched off, or given a new password, so a forgotten
 * password had no remedy and somebody who left kept their access.
 */
class EmployeeAccountManagementTest extends TestCase
{
    use RefreshDatabase;

    protected User $administrator;

    protected Section $rdo;

    protected Section $compliance;

    protected Role $staff;

    protected function setUp(): void
    {
        parent::setUp();

        $this->administrator = User::create([
            'name' => 'Office Administrator',
            'email' => 'admin@rdo111.test',
            'password' => 'password',
            'is_active' => true,
        ]);

        $this->rdo = Section::create(['section_code' => '1002', 'section_name' => 'RDO', 'is_active' => true]);
        $this->compliance = Section::create(['section_code' => '1005', 'section_name' => 'COMPLIANCE', 'is_active' => true]);

        $this->staff = Role::create(['role_name' => 'Staff', 'is_active' => true]);
    }

    protected function employee(array $overrides = []): EmployeeAcc
    {
        return EmployeeAcc::create(array_merge([
            'username' => 'rdo.staff',
            'full_name' => 'John Dela Cruz',
            'position' => 'Atty.',
            'password' => 'first-password',
            'section_id' => $this->rdo->section_id,
            'role_id' => $this->staff->role_id,
            'is_active' => true,
        ], $overrides));
    }

    protected function creationPayload(array $overrides = []): array
    {
        return array_merge([
            'username' => 'compliance.staff',
            'full_name' => 'Maria Santos',
            'position' => 'Chief',
            'email' => 'maria@rdo111.test',
            'password' => 'a-good-password',
            'password_confirmation' => 'a-good-password',
            'section_id' => $this->compliance->section_id,
            'role_id' => $this->staff->role_id,
            'is_active' => true,
        ], $overrides);
    }

    public function test_an_employee_cannot_reach_the_admin_panel(): void
    {
        /*
         * The two-guard split is what keeps the Admin Section - which
         * processes referrals like any other section - out of account
         * management. An employee holds a session on the employee guard,
         * and /admin is behind the web guard.
         *
         * Signed in through the real login route rather than actingAs():
         * actingAs($user, 'employee') also makes that the *default*
         * guard for the request, which the admin middleware would then
         * accept - something that never happens to a real visitor.
         */
        $this->employee(['username' => 'rdo.staff', 'password' => 'employee-password']);

        $this->post(route('login'), [
            'login' => 'rdo.staff',
            'password' => 'employee-password',
        ])->assertSessionHasNoErrors();

        $this->get(route('super.employees.index'))->assertRedirect(route('login'));
    }

    public function test_a_guest_cannot_reach_the_admin_panel(): void
    {
        $this->get(route('super.employees.index'))->assertRedirect(route('login'));
    }

    public function test_an_account_is_created_with_its_identity(): void
    {
        $this->actingAs($this->administrator)
            ->post(route('super.employees.store'), $this->creationPayload())
            ->assertSessionHasNoErrors();

        $employee = EmployeeAcc::where('username', 'compliance.staff')->first();

        $this->assertSame('Maria Santos', $employee->full_name);
        $this->assertSame('Chief', $employee->position);
        $this->assertSame('maria@rdo111.test', $employee->email);
        $this->assertSame('Chief Maria Santos', $employee->display_name);
        $this->assertTrue(Hash::check('a-good-password', $employee->password));
    }

    public function test_a_new_account_must_be_named(): void
    {
        $this->actingAs($this->administrator)
            ->post(route('super.employees.store'), $this->creationPayload(['full_name' => '']))
            ->assertSessionHasErrors('full_name');

        $this->assertSame(0, EmployeeAcc::count());
    }

    public function test_a_username_and_email_cannot_be_reused(): void
    {
        $this->employee(['username' => 'taken', 'email' => 'taken@rdo111.test']);

        $this->actingAs($this->administrator)
            ->post(route('super.employees.store'), $this->creationPayload(['username' => 'taken']))
            ->assertSessionHasErrors('username');

        $this->actingAs($this->administrator)
            ->post(route('super.employees.store'), $this->creationPayload(['email' => 'taken@rdo111.test']))
            ->assertSessionHasErrors('email');
    }

    public function test_an_account_can_be_corrected(): void
    {
        $employee = $this->employee();

        $this->actingAs($this->administrator)
            ->patch(route('super.employees.update', $employee), [
                'username' => 'rdo.chief',
                'full_name' => 'Juan Dela Cruz',
                'position' => 'Chief',
                'email' => 'juan@rdo111.test',
                'section_id' => $this->compliance->section_id,
                'role_id' => $this->staff->role_id,
            ])
            ->assertSessionHasNoErrors();

        $employee->refresh();

        $this->assertSame('rdo.chief', $employee->username);
        $this->assertSame('Chief Juan Dela Cruz', $employee->display_name);
        $this->assertSame($this->compliance->section_id, $employee->section_id);
    }

    public function test_editing_does_not_touch_the_password(): void
    {
        $employee = $this->employee();

        $this->actingAs($this->administrator)
            ->patch(route('super.employees.update', $employee), [
                'username' => $employee->username,
                'full_name' => 'John Dela Cruz',
                'section_id' => $this->rdo->section_id,
                'role_id' => $this->staff->role_id,

                // Ignored: changing a password is its own action.
                'password' => 'sneaked-in',
            ])
            ->assertSessionHasNoErrors();

        $this->assertTrue(Hash::check('first-password', $employee->fresh()->password));
    }

    public function test_an_account_that_predates_names_must_be_named_when_edited(): void
    {
        $bare = $this->employee(['full_name' => null, 'position' => null]);

        // Until then it shows its username, rather than nothing.
        $this->assertSame('rdo.staff', $bare->display_name);

        $this->actingAs($this->administrator)
            ->patch(route('super.employees.update', $bare), [
                'username' => $bare->username,
                'full_name' => '',
                'section_id' => $this->rdo->section_id,
                'role_id' => $this->staff->role_id,
            ])
            ->assertSessionHasErrors('full_name');
    }

    public function test_a_password_can_be_reset(): void
    {
        $employee = $this->employee();

        $this->actingAs($this->administrator)
            ->patch(route('super.employees.password', $employee), [
                'password' => 'brand-new-password',
                'password_confirmation' => 'brand-new-password',
            ])
            ->assertSessionHasNoErrors();

        $this->assertTrue(Hash::check('brand-new-password', $employee->fresh()->password));
    }

    public function test_a_reset_password_must_be_confirmed(): void
    {
        $employee = $this->employee();

        $this->actingAs($this->administrator)
            ->patch(route('super.employees.password', $employee), [
                'password' => 'brand-new-password',
                'password_confirmation' => 'something-else',
            ])
            ->assertSessionHasErrors('password');

        $this->assertTrue(Hash::check('first-password', $employee->fresh()->password));
    }

    public function test_an_account_can_be_switched_off_and_back_on(): void
    {
        $employee = $this->employee();

        $this->actingAs($this->administrator)
            ->patch(route('super.employees.active', $employee), ['is_active' => false])
            ->assertSessionHasNoErrors();

        $this->assertFalse($employee->fresh()->is_active);

        // And the account is still there, so its history still makes sense.
        $this->assertNotNull(EmployeeAcc::find($employee->employee_id));

        $this->actingAs($this->administrator)
            ->patch(route('super.employees.active', $employee), ['is_active' => true]);

        $this->assertTrue($employee->fresh()->is_active);
    }

    public function test_the_listing_names_people_and_can_be_searched(): void
    {
        $this->employee(['username' => 'rdo.staff', 'full_name' => 'John Dela Cruz', 'position' => 'Atty.']);

        // No title on this one, so the name stands on its own.
        $this->employee([
            'username' => 'compliance.staff',
            'full_name' => 'Maria Santos',
            'position' => null,
            'section_id' => $this->compliance->section_id,
        ]);

        $page = $this->actingAs($this->administrator)
            ->get(route('super.employees.index'))
            ->assertOk()
            ->viewData('page');

        $names = collect($page['props']['employees'])->pluck('display_name');

        $this->assertTrue($names->contains('Atty. John Dela Cruz'));
        $this->assertTrue($names->contains('Maria Santos'));

        // Searching finds a person by their name, not just their username.
        $page = $this->actingAs($this->administrator)
            ->get(route('super.employees.index', ['search' => 'santos']))
            ->assertOk()
            ->viewData('page');

        $this->assertCount(1, $page['props']['employees']);
        $this->assertSame('Maria Santos', $page['props']['employees'][0]['display_name']);
    }
}
