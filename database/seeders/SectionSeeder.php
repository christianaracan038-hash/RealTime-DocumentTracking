<?php

namespace Database\Seeders;

use App\Models\Section;
use Illuminate\Database\Seeder;

/**
 * The office sections that have a dashboard.
 *
 * Keep section_name in step with config/section.php — the section
 * middleware and the sidebar both match on it.
 *
 * firstOrCreate is deliberate: RDO and Assessment already exist with
 * their own numeric codes, and re-seeding must not overwrite them.
 */
class SectionSeeder extends Seeder
{
    public function run(): void
    {
        $sections = [

            [
                'section_code' => '1002',
                'section_name' => 'RDO',
                'description' => 'Revenue District Office',
                'is_active' => true,
            ],

            [
                'section_code' => '1001',
                'section_name' => 'ASSESSMENT',
                'description' => 'Assessment Section',
                'is_active' => true,
            ],

            [
                'section_code' => '1003',
                'section_name' => 'CSS',
                'description' => 'Client Support Section',
                'is_active' => true,
            ],

            [
                'section_code' => '1004',
                'section_name' => 'COLLECTION',
                'description' => 'Collection Section',
                'is_active' => true,
            ],

            [
                'section_code' => '1005',
                'section_name' => 'COMPLIANCE',
                'description' => 'Compliance Section',
                'is_active' => true,
            ],

        ];

        foreach ($sections as $section) {

            Section::firstOrCreate(
                ['section_name' => $section['section_name']],
                $section
            );

        }
    }
}
