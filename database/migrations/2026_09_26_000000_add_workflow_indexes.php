<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Indexes for the three queries the office runs all day.
 *
 * The documents table was indexed on the columns a person searches
 * (tracking number, taxpayer, concern) but not on the ones the workflow
 * filters by. Every dashboard load asked for
 *
 *     destination_section_id = mine AND status_id = Pending
 *
 * and Postgres answered it by reading every row in the table, because
 * neither column was indexed - one full scan per section, per person,
 * per refresh. That is invisible at a few hundred documents and is what
 * makes the system crawl as the year fills up. It is the growth of the
 * table that hurts, not the presence of old rows, so the fix is an
 * index rather than deleting history the office is required to keep.
 *
 * Each index is created only when it is missing, so this is safe to run
 * on a database that already has some of them.
 */
return new class extends Migration
{
    /**
     * Index name => the table and columns it covers.
     */
    protected array $indexes = [
        /*
        * Every section dashboard: what has been sent to me and is still
        * waiting to be received.
        */
        'documents_destination_status_index' => ['documents', ['destination_section_id', 'status_id']],

        /*
        * "On my desk": what I personally am holding.
        */
        'documents_holder_status_index' => ['documents', ['current_employee_id', 'status_id']],

        /*
        * The archive and any listing that starts from a status, newest
        * first.
        */
        'documents_status_created_index' => ['documents', ['status_id', 'created_at']],

        /*
        * The aging clock reads the newest movement of a document. Without
        * the tracked_at half, finding "the latest one" means sorting every
        * movement that document ever had.
        */
        'tracking_histories_document_tracked_index' => ['tracking_histories', ['document_id', 'tracked_at']],
    ];

    public function up(): void
    {
        foreach ($this->indexes as $name => [$table, $columns]) {
            if (! Schema::hasTable($table) || $this->exists($table, $name)) {
                continue;
            }

            // A column may be missing on an older database; skip if so.
            foreach ($columns as $column) {
                if (! Schema::hasColumn($table, $column)) {
                    continue 2;
                }
            }

            Schema::table($table, function (Blueprint $blueprint) use ($columns, $name) {
                $blueprint->index($columns, $name);
            });
        }
    }

    public function down(): void
    {
        foreach ($this->indexes as $name => [$table, $columns]) {
            if (! Schema::hasTable($table) || ! $this->exists($table, $name)) {
                continue;
            }

            Schema::table($table, function (Blueprint $blueprint) use ($name) {
                $blueprint->dropIndex($name);
            });
        }
    }

    protected function exists(string $table, string $name): bool
    {
        return collect(Schema::getIndexes($table))
            ->contains(fn (array $index) => $index['name'] === $name);
    }
};
