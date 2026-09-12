<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Every step checks before it acts. A parallel branch
     * (2026_09_07_010352_add_taxpayer_name_to_documents_table) already
     * added taxpayer_name on some databases, so this migration has to
     * succeed whether it runs first, second, or on a fresh schema.
     */
    public function up(): void
    {
        Schema::table('documents', function (Blueprint $table) {

            /*
            * Taxpayer the document belongs to.
            *
            * Nullable because documents registered before
            * this migration have no taxpayer on record.
            */
            if (! Schema::hasColumn('documents', 'taxpayer_name')) {
                $table->string('taxpayer_name', 255)
                    ->nullable()
                    ->after('document_date');
            }

            /*
            * Transaction / document type, chosen from
            * config('transaction_types').
            */
            if (! Schema::hasColumn('documents', 'transaction_type')) {
                $table->string('transaction_type', 100)
                    ->nullable()
                    ->after('taxpayer_name');
            }

        });

        /*
        * Both fields are searched directly in the database
        * before pagination, so they are indexed. Indexes are
        * added in a second pass so the columns exist first.
        */
        Schema::table('documents', function (Blueprint $table) {

            if (! Schema::hasIndex('documents', ['taxpayer_name'])) {
                $table->index('taxpayer_name');
            }

            if (! Schema::hasIndex('documents', ['transaction_type'])) {
                $table->index('transaction_type');
            }

        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('documents', function (Blueprint $table) {

            if (Schema::hasIndex('documents', ['taxpayer_name'])) {
                $table->dropIndex(['taxpayer_name']);
            }

            if (Schema::hasIndex('documents', ['transaction_type'])) {
                $table->dropIndex(['transaction_type']);
            }

        });

        Schema::table('documents', function (Blueprint $table) {

            /*
            * Only drop what this migration may have created. If
            * taxpayer_name came from the 2026_09_07 migration, that
            * migration owns it and will remove it on its own rollback.
            */
            $columns = array_filter(
                ['taxpayer_name', 'transaction_type'],
                fn ($column) => Schema::hasColumn('documents', $column)
            );

            if ($columns) {
                $table->dropColumn(array_values($columns));
            }

        });
    }
};
