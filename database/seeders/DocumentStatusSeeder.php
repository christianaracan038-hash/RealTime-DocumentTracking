<?php

namespace Database\Seeders;

use App\Models\DocumentStatus;
use Illuminate\Database\Seeder;

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

        /*
        * Archived (status_id 4) — a taxpayer went unresponsive and the
        * document has stalled with Admin. Like Completed, this is
        * terminal: nothing can be received or forwarded after this.
        * Inserted with an explicit status_id for the same reason as
        * Draft above.
        */
        DB::table('document_statuses')->updateOrInsert(
            [
                'status_id' => 4,
            ],
            [
                'status_name' => 'Archived',
                'status_color' => 'slate',
                'description' => 'Closed out by Admin — taxpayer unresponsive, no further movement.',
                'sort_order' => 4,
            ]
        );
    }
}
