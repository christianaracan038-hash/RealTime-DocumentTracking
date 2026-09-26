<?php

namespace Database\Seeders;

use App\Models\Role;
use Illuminate\Database\Seeder;

/**
 * The roles an employee account can hold.
 *
 * Only two of these mean anything to the code: a role named in
 * config('referral.registration_roles') limits the account to the
 * registration desk, and everything else gets the full section portal.
 *
 * Idempotent on role_name, so re-running never disturbs an account's
 * existing role.
 */
class RoleSeeder extends Seeder
{
    public function run(): void
    {
        $roles = [
            'Staff' => 'Section staff - the full portal for their section',

            /*
            * The RDO counter's first account. Registers arrivals as
            * taxpayers hand documents over, and sees nothing else.
            */
            'Registration' => 'Registration desk - step 1 only',
        ];

        foreach ($roles as $name => $description) {
            Role::firstOrCreate(
                ['role_name' => $name],
                ['description' => $description, 'is_active' => true]
            );
        }
    }
}
