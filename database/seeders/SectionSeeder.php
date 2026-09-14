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
 * A section is matched on its name. New ones are created in full;
 * existing ones keep their code but have their description refreshed,
 * because the description is what the referral form and the printed
 * slip show as the section's name and it must read the same everywhere.
 */
class SectionSeeder extends Seeder
{
    public function run(): void
    {
        $sections = [

            [
                'section_code' => '1002',
                'section_name' => 'RDO',
                'description' => "RDO's/ARDO's Office",
            ],

            [
                'section_code' => '1001',
                'section_name' => 'ASSESSMENT',
                'description' => 'Assessment Section',
            ],

            [
                'section_code' => '1003',
                'section_name' => 'CSS',
                'description' => 'Client Support Section',
            ],

            [
                'section_code' => '1004',
                'section_name' => 'COLLECTION',
                'description' => 'Collection Section',
            ],

            [
                'section_code' => '1005',
                'section_name' => 'COMPLIANCE',
                'description' => 'Compliance Section',
            ],

            [
                'section_code' => '1006',
                'section_name' => 'ADMIN',
                'description' => 'Admin Section',
            ],

        ];

        foreach ($sections as $section) {

            $row = Section::firstOrCreate(
                ['section_name' => $section['section_name']],
                $section + ['is_active' => true]
            );

            if (! $row->wasRecentlyCreated) {
                $row->update(['description' => $section['description']]);
            }

        }
    }
}
