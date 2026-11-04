<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Adds missing indexes for frequently queried columns that were not
     * covered by the original workflow indexes migration.
     */
    public function up(): void
    {
        Schema::table('documents', function (Blueprint $table) {
            /*
            * Archive dashboard filters by archived_at newest first.
            */
            if (! Schema::hasIndex('documents', ['archived_at'])) {
                $table->index('archived_at');
            }

            /*
            * SuperAdmin deletion queue filters by deletion_requested_at.
            */
            if (! Schema::hasIndex('documents', ['deletion_requested_at'])) {
                $table->index('deletion_requested_at');
            }

            /*
            * SuperAdmin deletion history filters by deletion_approved_at.
            */
            if (! Schema::hasIndex('documents', ['deletion_approved_at'])) {
                $table->index('deletion_approved_at');
            }

            /*
            * Reports export filters by document_date range.
            */
            if (! Schema::hasIndex('documents', ['document_date'])) {
                $table->index('document_date');
            }

            /* Note: 'created_by' already has an index from the original
             * create_documents_table migration - no need to add again.
             */
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('documents', function (Blueprint $table) {
            $table->dropIndex(['archived_at']);
            $table->dropIndex(['deletion_requested_at']);
            $table->dropIndex(['deletion_approved_at']);
            $table->dropIndex(['document_date']);
        });
    }
};