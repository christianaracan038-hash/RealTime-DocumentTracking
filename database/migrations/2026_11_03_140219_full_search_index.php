<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Adds PostgreSQL Full-Text Search (GIN) index for fast document search.
     *
     * Safe to run on SQLite - it checks the driver before creating the index.
     */
    public function up(): void
    {
        if (DB::getDriverName() !== 'pgsql') {
            return;
        }

        DB::statement("CREATE INDEX documents_fulltext_search_idx ON documents USING GIN (to_tsvector('english', coalesce(tracking_number, '') || ' ' || coalesce(taxpayer_name, '') || ' ' || coalesce(concern, '') || ' ' || coalesce(reference_number, '') || ' ' || coalesce(description, '')))");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (DB::getDriverName() !== 'pgsql') {
            return;
        }

        Schema::table('documents', function (Blueprint $table) {
            $table->dropIndex('documents_fulltext_search_idx');
        });
    }
};