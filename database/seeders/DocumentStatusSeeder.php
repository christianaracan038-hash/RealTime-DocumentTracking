<?php

namespace Database\Seeders;

use App\Models\DocumentStatus;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class DocumentStatusSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        /*
        * Draft (status_id 0) — a document that has a tracking number
        * and QR code (Step 1) but has not yet had its referral details
        * filled in (Step 2). Inserted through the query builder with
        * an explicit status_id, since 0 falls outside the normal
        * auto-increment sequence used by the statuses below.
        */
        DB::table('document_statuses')->updateOrInsert(
            [
                'status_id' => 0,
            ],
            [
                'status_name' => 'Draft',
                'status_color' => 'gray',
                'description' => 'QR generated; referral details not yet completed.',
                'sort_order' => 0,
            ]
        );

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

            /*
            * The end of a document's journey. Set by the holder once the
            * requested action is done; nothing can be received or
            * forwarded after this. The code compares status_id 3.
            */
            [
                'status_name' => 'Completed',
                'status_color' => 'blue',
                'description' => 'The requested action has been carried out. No further movement.',
                'sort_order' => 3,
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