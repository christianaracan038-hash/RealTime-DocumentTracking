<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('documents', function (Blueprint $table) {

            /*
            * Remove old status column.
            *
            * The index has to go first. PostgreSQL drops it along with
            * the column, but SQLite (used by the test suite) rebuilds
            * the table and fails on the orphaned index.
            */
            $table->dropIndex(['document_statuses']);

            $table->dropColumn('document_statuses');

            // Add new status relationship
            $table->foreignId('status_id')
                ->after('reference_number')
                ->constrained('document_statuses', 'status_id')
                ->restrictOnDelete();

            // Current employee holding the document
            $table->foreignId('current_holder')
                ->nullable()
                ->after('current_section_id')
                ->constrained('employees_acc', 'employee_id')
                ->nullOnDelete();

            // Next destination section
            $table->foreignId('destination_section_id')
                ->nullable()
                ->after('current_holder')
                ->constrained('sections', 'section_id')
                ->nullOnDelete();

            // QR Code image/path
            $table->string('qr_path')
                ->nullable()
                ->after('is_confidential');
        });
    }

    public function down(): void
    {
        Schema::table('documents', function (Blueprint $table) {

            $table->dropForeign(['status_id']);
            $table->dropForeign(['current_holder']);
            $table->dropForeign(['destination_section_id']);

            $table->dropColumn([
                'status_id',
                'current_holder',
                'destination_section_id',
                'qr_path',
            ]);

            $table->string('document_statuses', 50)
                ->default('Pending');
        });
    }
};
