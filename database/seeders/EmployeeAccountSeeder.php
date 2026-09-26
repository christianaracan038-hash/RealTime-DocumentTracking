<?php

namespace Database\Seeders;

use App\Models\EmployeeAcc;
use App\Models\Role;
use App\Models\Section;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

/**
 * One login per section, for setting up and testing the portal.
 *
 * The password is read from EMPLOYEE_SEED_PASSWORD in .env and is
 * deliberately not stored in this file — .env is gitignored, so the
 * password never reaches the repository. Set it, run the seeder, then
 * remove the line again.
 *
 * Existing accounts are left alone: firstOrCreate matches on username,
 * so re-running this never changes a password someone is already using.
 */
class EmployeeAccountSeeder extends Seeder
{
    public function run(): void
    {
        $password = env('EMPLOYEE_SEED_PASSWORD');

        if (blank($password)) {
            $this->command->error(
                'Set EMPLOYEE_SEED_PASSWORD in your .env file first, e.g.'
            );
            $this->command->line('    EMPLOYEE_SEED_PASSWORD=SomethingOnlyYouKnow');
            $this->command->line('Then run this seeder again, and remove the line afterwards.');

            return;
        }

        if (strlen($password) < 8) {
            $this->command->error('EMPLOYEE_SEED_PASSWORD must be at least 8 characters.');

            return;
        }

        $role = Role::firstOrCreate(
            ['role_name' => 'Staff'],
            ['description' => 'Section staff', 'is_active' => true]
        );

        /*
        * The counter's own account. Named in
        * config('referral.registration_roles'), which is what limits it
        * to the registration desk.
        */
        $registrationRole = Role::firstOrCreate(
            ['role_name' => config('referral.registration_roles')[0] ?? 'Registration'],
            ['description' => 'Registration desk - step 1 only', 'is_active' => true]
        );

        /*
        * Every section that has a dashboard gets a login, so the whole
        * routing workflow can be walked end to end.
        */
        foreach (array_keys(config('section')) as $sectionName) {

            $section = Section::where('section_name', $sectionName)->first();

            if (! $section) {
                $this->command->warn(
                    "Section {$sectionName} is not in the database. Run SectionSeeder first."
                );

                continue;
            }

            $username = strtolower($sectionName).'.staff';

            $employee = EmployeeAcc::firstOrCreate(
                ['username' => $username],
                [
                    'full_name' => Str::title($sectionName).' Staff',
                    'password' => $password,
                    'section_id' => $section->section_id,
                    'role_id' => $role->role_id,
                    'is_active' => true,
                ]
            );

            $this->command->line(
                $employee->wasRecentlyCreated
                    ? "  created  {$username}  ({$sectionName})"
                    : "  exists   {$username}  ({$sectionName}) - password unchanged"
            );

            /*
            * The RDO runs its counter on two accounts: this one
            * registers arrivals, <section>.staff completes them.
            */
            if (! in_array($sectionName, config('referral.details_completion_sections', []), true)) {
                continue;
            }

            $deskUsername = strtolower($sectionName).'.counter';

            $desk = EmployeeAcc::firstOrCreate(
                ['username' => $deskUsername],
                [
                    'full_name' => Str::title($sectionName).' Counter',
                    'password' => $password,
                    'section_id' => $section->section_id,
                    'role_id' => $registrationRole->role_id,
                    'is_active' => true,
                ]
            );

            $this->command->line(
                $desk->wasRecentlyCreated
                    ? "  created  {$deskUsername}  ({$sectionName} - registration desk)"
                    : "  exists   {$deskUsername}  ({$sectionName} - registration desk) - password unchanged"
            );
        }
    }
}
