<?php

namespace Tests\Feature\Admin;

use App\Models\EmployeeAcc;
use App\Models\Role;
use App\Models\Section;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * The super administrator's landing page.
 *
 * It lives at /super-admin, not /admin. The office has an Admin Section
 * that processes referrals exactly like Compliance or CSS, and landing
 * the account that authorises everybody on a page headed "Admin" made the
 * two look like the same thing.
 *
 * The question the page answers is who can sign in, by section - because
 * a section with nobody able to sign in is a section whose documents stop
 * moving.
 */
class SuperAdminOverviewTest extends TestCase
{
    use RefreshDatabase;

    protected User $superAdmin;

    protected Section $rdo;

    protected Section $compliance;

    protected Role $staff;

    protected function setUp(): void
    {
        parent::setUp();

        $this->superAdmin = User::factory()->create();

        $this->rdo = Section::create([
            'section_code' => '1002',
            'section_name' => 'RDO',
            'description' => "RDO's/ARDO's Office",
            'is_active' => true,
        ]);

        $this->compliance = Section::create([
            'section_code' => '1005',
            'section_name' => 'COMPLIANCE',
            'description' => 'Compliance Section',
            'is_active' => true,
        ]);

        $this->staff = Role::create(['role_name' => 'Staff', 'is_active' => true]);
    }

    protected function employee(Section $section, array $overrides = []): EmployeeAcc
    {
        return EmployeeAcc::create(array_merge([
            'username' => strtolower($section->section_name).'.staff',
            'full_name' => 'Somebody Real',
            'password' => 'password',
            'section_id' => $section->section_id,
            'role_id' => $this->staff->role_id,
            'is_active' => true,
        ], $overrides));
    }

    protected function overview(): array
    {
        return $this->actingAs($this->superAdmin)
            ->get(route('super.dashboard'))
            ->assertOk()
            ->viewData('page')['props'];
    }

    public function test_signing_in_lands_on_the_overview(): void
    {
        $this->post(route('login'), [
            'login' => $this->superAdmin->email,
            'password' => 'password',
        ])->assertRedirect(route('super.dashboard'));
    }

    public function test_the_old_dashboard_address_still_lands_somewhere_sensible(): void
    {
        $this->actingAs($this->superAdmin)
            ->get('/dashboard')
            ->assertRedirect(route('super.dashboard'));
    }

    public function test_it_counts_accounts_by_section(): void
    {
        $this->employee($this->rdo);
        $this->employee($this->rdo, ['username' => 'rdo.counter']);
        $this->employee($this->compliance, ['is_active' => false]);

        $props = $this->overview();

        $sections = collect($props['sections'])->keyBy('section_name');

        $this->assertSame(2, $sections['RDO']['accounts']);
        $this->assertSame(2, $sections['RDO']['active']);

        // Present but unable to sign in, which is worth seeing.
        $this->assertSame(1, $sections['COMPLIANCE']['accounts']);
        $this->assertSame(0, $sections['COMPLIANCE']['active']);
    }

    public function test_a_section_with_nobody_in_it_is_still_listed(): void
    {
        $empty = Section::create([
            'section_code' => '1006',
            'section_name' => 'CSS',
            'is_active' => true,
        ]);

        $sections = collect($this->overview()['sections'])->pluck('section_name');

        $this->assertTrue($sections->contains($empty->section_name));
    }

    public function test_it_lists_the_accounts_that_still_need_naming(): void
    {
        $this->employee($this->rdo);
        $this->employee($this->compliance, ['full_name' => null]);

        $props = $this->overview();

        $this->assertSame(1, $props['totals']['employees_unnamed']);

        $needing = collect($props['needsNaming']);

        $this->assertCount(1, $needing);
        $this->assertSame('compliance.staff', $needing->first()['username']);
        $this->assertSame('COMPLIANCE', $needing->first()['section']);
    }

    public function test_it_counts_super_admins_separately_from_employees(): void
    {
        $this->employee($this->rdo);

        User::factory()->create(['is_active' => false]);

        $totals = $this->overview()['totals'];

        $this->assertSame(1, $totals['employees']);
        $this->assertSame(2, $totals['administrators']);
        $this->assertSame(1, $totals['administrators_active']);
    }

    public function test_an_employee_cannot_reach_the_super_admin_area(): void
    {
        /*
         * Through the real login route: actingAs($user, 'employee') would
         * also make that the default guard for the request, which the web
         * guard would then accept - something no real visitor can do.
         */
        $this->employee($this->rdo, ['password' => 'employee-password']);

        $this->post(route('login'), [
            'login' => 'rdo.staff',
            'password' => 'employee-password',
        ])->assertSessionHasNoErrors();

        foreach (
            [
                'super.dashboard',
                'super.employees.index',
                'super.administrators.index',
                'super.sections.index',
                'super.roles.index',
            ] as $name
        ) {
            $this->get(route($name))->assertRedirect(route('login'));
        }
    }

    public function test_a_guest_cannot_reach_the_super_admin_area(): void
    {
        $this->get(route('super.dashboard'))->assertRedirect(route('login'));
    }
}
