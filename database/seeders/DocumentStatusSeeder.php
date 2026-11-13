<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class DocumentStatusSeeder extends Seeder
{
    public function run(): void
    {
        $statuses = [
            1 => [
                'status_name'  => 'Pending',
                'status_color' => 'yellow',
                'description'  => 'Document has been registered.',
                'sort_order'   => 1,
            ],
            2 => [
                'status_name'  => 'Received',
                'status_color' => 'green',
                'description'  => 'Document has been received by the destination section.',
                'sort_order'   => 2,
            ],
            3 => [
                'status_name'  => 'Completed',
                'status_color' => 'blue',
                'description'  => 'The requested action has been carried out. No further movement.',
                'sort_order'   => 3,
            ],
            4 => [
                'status_name'  => 'Archived',
                'status_color' => 'slate',
                'description'  => 'Closed out by Admin — taxpayer unresponsive, no further movement.',
                'sort_order'   => 4,
            ],
            5 => [
                'status_name'  => 'For Archiving',
                'status_color' => '#6366f1',
                'description'  => 'Forwarded to Admin for archiving. Becomes Archived once Admin receives it.',
                'sort_order'   => 5,
            ],
        ];

        foreach ($statuses as $id => $status) {
            DB::table('document_statuses')->updateOrInsert(
                ['status_id' => $id],
                $status + [
                    'is_active'  => true,
                    'updated_at' => now(),
                    'created_at' => now(),
                ]
            );
        }

        DB::statement(
            "SELECT setval(pg_get_serial_sequence('document_statuses', 'status_id'),
                           (SELECT MAX(status_id) FROM document_statuses))"
        );
    }
}