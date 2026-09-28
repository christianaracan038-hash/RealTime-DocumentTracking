<?php

namespace Tests\Feature\Admin;

use App\Models\AuditLog;
use App\Models\EmployeeAcc;
use App\Models\Role;
use App\Models\Section;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use RuntimeException;
use Tests\TestCase;

/**
 * The audit log.
 *
 * tracking_histories records what happened to a document; nothing has
 * ever recorded what happened to the system. These tests are mostly
 * about the two properties that make a log worth having: that it records
 * the things that grant and revoke access, and that nobody - including
 * an administrator - can go back and tidy it.
 */
class AuditLogTest extends TestCase
{
    use RefreshDatabase;

    protected User $administrator;

    protected Section $rdo;

    protected Role $staff;

    protected function setUp(): void
    {
        parent::setUp();

        $this->administrator = User::factory()->create([
            'name' => 'Office Administrator',
            'email' => 'admin@rdo111.test',
            'password' => 'admin-password',
        ]);

        $this->rdo = Section::create([
            'section_code' => '1002', 'section_name' => 'RDO', 'is_active' => true,
        ]);

        $this->staff = Role::create(['role_name' => 'Staff', 'is_active' => true]);
    }

    protected function employee(array $overrides = []): EmployeeAcc
    {
        return EmployeeAcc::create(array_merge([
            'username' => 'rdo.staff',
            'full_name' => 'John Dela Cruz',
            'position' => 'Atty.',
            'password' => 'staff-password',
            'section_id' => $this->rdo->section_id,
            'role_id' => $this->staff->role_id,
            'is_active' => true,
        ], $overrides));
    }

    protected function lastEntry(?string $action = null): ?AuditLog
    {
        return AuditLog::query()
            ->when($action, fn ($q) => $q->where('action', $action))
            ->latest('audit_log_id')
            ->first();
    }

    /*
    |--------------------------------------------------------------------------
    | It cannot be tidied
    |--------------------------------------------------------------------------
    */

    public function test_an_entry_cannot_be_changed(): void
    {
        AuditLog::record('login');

        $entry = $this->lastEntry();

        $this->expectException(RuntimeException::class);

        $entry->update(['action' => 'something.else']);
    }

    public function test_an_entry_cannot_be_deleted(): void
    {
        AuditLog::record('login');

        $entry = $this->lastEntry();

        $this->expectException(RuntimeException::class);

        $entry->delete();
    }

    public function test_it_survives_the_account_it_names(): void
    {
        $employee = $this->employee();

        $this->actingAs($this->administrator)
            ->patch(route('super.employees.active', $employee), ['is_active' => false]);

        $entry = $this->lastEntry('employee.deactivated');

        $this->assertSame('Atty. John Dela Cruz (rdo.staff)', $entry->subject_label);

        /*
         * Deleting the account must not take the record of what was done
         * to it - which is why nothing here is foreign-keyed.
         */
        $employee->delete();

        $this->assertSame(
            'Atty. John Dela Cruz (rdo.staff)',
            $entry->fresh()->subject_label
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Signing in
    |--------------------------------------------------------------------------
    */

    public function test_a_successful_sign_in_is_recorded(): void
    {
        $this->employee();

        $this->post(route('login'), [
            'login' => 'rdo.staff',
            'password' => 'staff-password',
        ])->assertSessionHasNoErrors();

        $entry = $this->lastEntry('login');

        $this->assertSame('employee', $entry->actor_type);
        $this->assertSame('Atty. John Dela Cruz (rdo.staff)', $entry->actor_label);
    }

    public function test_a_failed_sign_in_is_recorded_without_the_password(): void
    {
        $this->employee();

        $this->post(route('login'), [
            'login' => 'rdo.staff',
            'password' => 'wrong-password',
        ])->assertSessionHasErrors('login');

        $entry = $this->lastEntry('login.failed');

        $this->assertNotNull($entry, 'A failed attempt is the whole point.');
        $this->assertSame('rdo.staff', $entry->context['tried']);
        $this->assertTrue($entry->context['account_exists']);

        // Nothing anywhere in the row may carry what they typed.
        $this->assertStringNotContainsString(
            'wrong-password',
            json_encode($entry->toArray())
        );
    }

    public function test_a_guess_at_a_username_that_does_not_exist_is_marked(): void
    {
        $this->post(route('login'), [
            'login' => 'nobody.here',
            'password' => 'guessing',
        ]);

        $entry = $this->lastEntry('login.failed');

        $this->assertSame('nobody.here', $entry->context['tried']);

        /*
         * The login screen will not say whether an account exists, and
         * should not. The log says, because the administrator reading it
         * needs to tell a locked-out clerk from somebody guessing names.
         */
        $this->assertFalse($entry->context['account_exists']);
    }

    public function test_signing_in_finally_writes_last_login(): void
    {
        $employee = $this->employee();

        $this->assertNull($employee->last_login, 'Null on every account until now.');

        $this->post(route('login'), [
            'login' => 'rdo.staff',
            'password' => 'staff-password',
        ]);

        $this->assertNotNull($employee->fresh()->last_login);
    }

    /*
    |--------------------------------------------------------------------------
    | Granting and revoking access
    |--------------------------------------------------------------------------
    */

    public function test_creating_an_employee_is_recorded_against_the_administrator(): void
    {
        $this->actingAs($this->administrator)
            ->post(route('super.employees.store'), [
                'username' => 'rdo.new',
                'full_name' => 'Maria Santos',
                'password' => 'a-good-password',
                'password_confirmation' => 'a-good-password',
                'section_id' => $this->rdo->section_id,
                'role_id' => $this->staff->role_id,
            ])
            ->assertSessionHasNoErrors();

        $entry = $this->lastEntry('employee.created');

        $this->assertSame('admin', $entry->actor_type);
        $this->assertSame('Office Administrator (admin@rdo111.test)', $entry->actor_label);
        $this->assertSame('Maria Santos (rdo.new)', $entry->subject_label);
    }

    public function test_a_password_reset_is_recorded_but_the_password_is_not(): void
    {
        $employee = $this->employee();

        $this->actingAs($this->administrator)
            ->patch(route('super.employees.password', $employee), [
                'password' => 'brand-new-password',
                'password_confirmation' => 'brand-new-password',
            ]);

        $entry = $this->lastEntry('employee.password_reset');

        $this->assertNotNull($entry);
        $this->assertStringNotContainsString(
            'brand-new-password',
            json_encode($entry->toArray())
        );
    }

    public function test_an_edit_records_only_what_actually_changed(): void
    {
        $employee = $this->employee();

        $this->actingAs($this->administrator)
            ->patch(route('super.employees.update', $employee), [
                'username' => $employee->username,
                'full_name' => 'Juan Dela Cruz',
                'position' => $employee->position,
                'section_id' => $employee->section_id,
                'role_id' => $employee->role_id,
            ])
            ->assertSessionHasNoErrors();

        $entry = $this->lastEntry('employee.updated');

        /*
         * The form posts every field whether or not it was touched. A log
         * that says "changed everything" on every edit says nothing.
         */
        $this->assertSame(['full_name'], $entry->context['changed']);
    }

    public function test_creating_an_administrator_is_recorded(): void
    {
        $this->actingAs($this->administrator)
            ->post(route('super.administrators.store'), [
                'name' => 'Christian Aracan',
                'email' => 'christian@rdo111.test',
                'password' => 'a-good-password',
                'password_confirmation' => 'a-good-password',
            ])
            ->assertSessionHasNoErrors();

        $entry = $this->lastEntry('administrator.created');

        $this->assertSame('Office Administrator (admin@rdo111.test)', $entry->actor_label);
        $this->assertSame('Christian Aracan (christian@rdo111.test)', $entry->subject_label);
    }

    /*
    |--------------------------------------------------------------------------
    | Reading it
    |--------------------------------------------------------------------------
    */

    public function test_only_an_administrator_can_read_it(): void
    {
        $this->employee(['password' => 'staff-password']);

        $this->post(route('login'), [
            'login' => 'rdo.staff',
            'password' => 'staff-password',
        ]);

        $this->get(route('super.audit.index'))->assertRedirect(route('login'));
    }

    public function test_a_guest_cannot_read_it(): void
    {
        $this->get(route('super.audit.index'))->assertRedirect(route('login'));
    }

    public function test_it_reads_newest_first_and_can_be_filtered(): void
    {
        AuditLog::record('employee.created', $this->employee());

        $this->travel(1)->minute();

        $this->post(route('login'), ['login' => 'nobody', 'password' => 'x']);

        $props = $this->actingAs($this->administrator)
            ->get(route('super.audit.index'))
            ->assertOk()
            ->viewData('page')['props'];

        $this->assertSame('login.failed', $props['entries']['data'][0]['action']);

        // And the failures on their own.
        $props = $this->actingAs($this->administrator)
            ->get(route('super.audit.index', ['group' => 'failed']))
            ->assertOk()
            ->viewData('page')['props'];

        $actions = collect($props['entries']['data'])->pluck('action')->unique();

        $this->assertSame(['login.failed'], $actions->all());
        $this->assertSame(1, $props['recentFailures']);
    }

    public function test_a_failure_to_log_never_breaks_the_thing_it_logs(): void
    {
        /*
         * A password reset that fails because the log was unreachable is
         * worse than a missing entry, so record() swallows and reports.
         */
        $employee = $this->employee();

        Schema::drop('audit_logs');

        $this->actingAs($this->administrator)
            ->patch(route('super.employees.password', $employee), [
                'password' => 'brand-new-password',
                'password_confirmation' => 'brand-new-password',
            ])
            ->assertSessionHasNoErrors();

        $this->assertTrue(
            Hash::check('brand-new-password', $employee->fresh()->password)
        );
    }
}
