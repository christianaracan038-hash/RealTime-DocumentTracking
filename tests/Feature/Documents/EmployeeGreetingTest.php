<?php

namespace Tests\Feature\Documents;

use App\Models\DocumentStatus;
use App\Models\EmployeeAcc;
use App\Models\Role;
use App\Models\Section;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * The name the header greets somebody by.
 *
 * "Atty. John" - a title and a first name. Deliberately null when there
 * is no name on file, because "Good morning, rdo.staff" is worse than
 * "Good morning" on its own.
 */
class EmployeeGreetingTest extends TestCase
{
    use RefreshDatabase;

    protected Section $rdo;

    protected Role $staff;

    protected function setUp(): void
    {
        parent::setUp();

        DocumentStatus::create(['status_name' => 'Pending', 'status_color' => 'yellow', 'sort_order' => 1]);
        DocumentStatus::create(['status_name' => 'Received', 'status_color' => 'green', 'sort_order' => 2]);

        $this->rdo = Section::create(['section_code' => '1002', 'section_name' => 'RDO', 'is_active' => true]);
        $this->staff = Role::create(['role_name' => 'Staff', 'is_active' => true]);
    }

    protected function employee(array $overrides = []): EmployeeAcc
    {
        return EmployeeAcc::create(array_merge([
            'username' => 'rdo.staff',
            'full_name' => 'John Dela Cruz',
            'position' => 'Atty.',
            'password' => 'password',
            'section_id' => $this->rdo->section_id,
            'role_id' => $this->staff->role_id,
            'is_active' => true,
        ], $overrides));
    }

    public function test_it_is_the_title_and_the_first_name(): void
    {
        $this->assertSame('Atty. John', $this->employee()->short_name);
    }

    public function test_a_person_with_no_title_is_greeted_by_first_name(): void
    {
        $this->assertSame(
            'Maria',
            $this->employee(['position' => null, 'full_name' => 'Maria Santos'])->short_name
        );
    }

    public function test_a_long_name_is_still_just_the_first(): void
    {
        $this->assertSame(
            'Chief Ma.',
            $this->employee([
                'position' => 'Chief',
                'full_name' => 'Ma. Cristina Reyes-Villanueva',
            ])->short_name
        );
    }

    public function test_an_account_with_no_name_is_not_greeted_by_its_username(): void
    {
        $this->assertNull($this->employee(['full_name' => null])->short_name);
    }

    public function test_it_travels_with_the_signed_in_employee(): void
    {
        $employee = $this->employee();

        $page = $this->actingAs($employee, 'employee')
            ->get(route('rdo.dashboard'))
            ->assertOk()
            ->viewData('page');

        $this->assertSame('Atty. John', $page['props']['auth']['employee']['short_name']);
    }

    public function test_it_does_not_travel_to_another_section(): void
    {
        $compliance = Section::create([
            'section_code' => '1005', 'section_name' => 'COMPLIANCE', 'is_active' => true,
        ]);

        $this->employee();

        $outsider = EmployeeAcc::create([
            'username' => 'compliance.staff',
            'full_name' => 'Pedro Reyes',
            'password' => 'password',
            'section_id' => $compliance->section_id,
            'role_id' => $this->staff->role_id,
            'is_active' => true,
        ]);

        $page = $this->actingAs($outsider, 'employee')
            ->get(route('compliance.dashboard'))
            ->assertOk()
            ->viewData('page');

        /*
         * Their own name, and nobody else's - short_name is an accessor
         * on a model whose name columns stay hidden, so it only ever
         * reaches the person it belongs to.
         */
        $this->assertSame('Pedro', $page['props']['auth']['employee']['short_name']);

        $this->assertStringNotContainsString(
            'John',
            json_encode($page['props']['documents'])
        );
    }
}
