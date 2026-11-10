<?php

namespace Database\Seeders;

use App\Models\Section;
use Illuminate\Database\Seeder;

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
                'description' => 'Administrative Section',
            ],

            [
                'section_code' => '1007',
                'section_name' => 'OTHERS',
                'description' => 'Others (outside the District)',
            ],

            [
                'section_code' => '1008',
                'section_name' => 'ASSESSMENT-GS-DORION',
                'description' => 'ASSESSMENT-GS-DORION',
            ],

            [
                'section_code' => '1009',
                'section_name' => 'ASSESSMENT-GS-INSOY',
                'description' => 'ASSESSMENT-GS-INSOY',
            ],

            [
                'section_code' => '1012',
                'section_name' => 'ASSESSMENT-GS-NGO',
                'description' => 'ASSESSMENT-GS-NGO',
            ],

            [
                'section_code' => '1013',
                'section_name' => 'ASSESSMENT-GS-GAWAEN',
                'description' => 'ASSESSMENT-GS-GAWAEN',
            ],

            [
                'section_code' => '1014',
                'section_name' => 'ASSESSMENT-GS-ORFIANO',
                'description' => 'ASSESSMENT-GS-ORFIANO',
            ],

            [
                'section_code' => '1015',
                'section_name' => 'ASSESSMENT-GS-DAVID',
                'description' => 'ASSESSMENT-GS-DAVID',
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