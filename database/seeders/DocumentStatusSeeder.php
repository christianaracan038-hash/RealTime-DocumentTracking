<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\DocumentStatus;

class DocumentStatusSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $statuses = [

            [
                'status_name' => 'Pending',
                'status_color' => 'yellow',
                'description' => 'Document has been registered.',
                'sort_order' => 1,
            ],


            [
                'status_name' => 'Received',
                'status_color' => 'green',
                'description' => 'Document has been received by the destination section.',
                'sort_order' => 2,
            ],

        ];

        foreach ($statuses as $status) {

            DocumentStatus::updateOrCreate(

                [
                    'status_name' => $status['status_name'],
                ],

                $status

            );

        }
    }
}