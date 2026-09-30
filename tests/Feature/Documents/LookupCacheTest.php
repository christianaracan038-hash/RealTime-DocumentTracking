<?php

namespace Tests\Feature\Documents;

use App\Models\Role;
use App\Models\Section;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/**
 * Sections and roles are read from the cache, not the wire.
 *
 * The database is in Tokyo and every query costs about 290ms of network.
 * These two tables hold a handful of rows that change a few times a year,
 * and reading them on every request to put one name in the header was a
 * third of a second of somebody waiting.
 *
 * The risk that buys is staleness - a section renamed in the super admin
 * panel still showing its old name - so the invalidation is what these
 * tests are really about.
 */
class LookupCacheTest extends TestCase
{
    use RefreshDatabase;

    protected function countQueries(callable $work): int
    {
        $count = 0;

        DB::listen(function () use (&$count) {
            $count++;
        });

        $work();

        return $count;
    }

    public function test_a_section_is_read_once_however_often_it_is_asked_for(): void
    {
        $section = Section::create([
            'section_code' => '1002', 'section_name' => 'RDO', 'is_active' => true,
        ]);

        // Warm it, the way the first request of the day does.
        Section::lookup();

        $queries = $this->countQueries(function () use ($section) {
            for ($i = 0; $i < 20; $i++) {
                $this->assertSame('RDO', Section::cached($section->section_id)?->section_name);
            }
        });

        $this->assertSame(0, $queries, 'Twenty reads, no round trips.');
    }

    public function test_renaming_a_section_is_visible_at_once(): void
    {
        $section = Section::create([
            'section_code' => '1002', 'section_name' => 'RDO', 'is_active' => true,
        ]);

        $this->assertSame('RDO', Section::cached($section->section_id)?->section_name);

        /*
         * The super admin panel renames it. Without the invalidation
         * hook the sidebar would keep the old name until something else
         * happened to clear the cache - which is to say, for a week.
         */
        $section->update(['section_name' => 'RDO-EAST']);

        $this->assertSame('RDO-EAST', Section::cached($section->section_id)?->section_name);
    }

    public function test_a_new_section_appears_at_once(): void
    {
        Section::create(['section_code' => '1002', 'section_name' => 'RDO', 'is_active' => true]);

        Section::lookup();

        $added = Section::create([
            'section_code' => '1005', 'section_name' => 'COMPLIANCE', 'is_active' => true,
        ]);

        $this->assertSame('COMPLIANCE', Section::cached($added->section_id)?->section_name);
    }

    public function test_a_deleted_section_stops_being_returned(): void
    {
        $section = Section::create([
            'section_code' => '1002', 'section_name' => 'RDO', 'is_active' => true,
        ]);

        $id = $section->section_id;

        $this->assertNotNull(Section::cached($id));

        $section->delete();

        $this->assertNull(Section::cached($id));
    }

    public function test_a_role_rename_is_visible_at_once(): void
    {
        $role = Role::create(['role_name' => 'Staff', 'is_active' => true]);

        $this->assertSame('Staff', Role::cached($role->role_id)?->role_name);

        /*
         * This one decides whether an account is locked to the
         * registration desk, so a stale read would put somebody in the
         * wrong portal.
         */
        $role->update(['role_name' => config('referral.registration_roles')[0]]);

        $this->assertSame(
            config('referral.registration_roles')[0],
            Role::cached($role->role_id)?->role_name
        );
    }

    public function test_an_unknown_id_is_null_rather_than_an_error(): void
    {
        Section::create(['section_code' => '1002', 'section_name' => 'RDO', 'is_active' => true]);

        $this->assertNull(Section::cached(9999));
        $this->assertNull(Section::cached(null));
    }
}
