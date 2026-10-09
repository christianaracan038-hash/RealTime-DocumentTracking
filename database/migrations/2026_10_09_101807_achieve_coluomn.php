<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('documents', function (Blueprint $table) {
            $table->timestamp('archived_at')->nullable();
            $table->unsignedBigInteger('archived_by')->nullable();

            $table->foreign('archived_by')
                ->references('employee_id')
                ->on('employees_acc')
                ->nullOnDelete();
        });

        if (Schema::hasColumn('documents', 'archive_requested_at')) {
            Schema::table('documents', function (Blueprint $table) {
                $table->dropColumn('archive_requested_at');
            });
        }

        $archived = DB::table('document_statuses')->where('status_id', 4)->first();

        DB::table('document_statuses')->updateOrInsert(
            ['status_id' => 5],
            [
                'status_name' => 'For Archiving',
                'status_color' => $archived->status_color ?? null,
                'description' => 'Forwarded to Admin for archiving. Becomes Archived once Admin receives it.',
                'is_active' => true,
                'sort_order' => (int) DB::table('document_statuses')->max('sort_order') + 1,
                'created_at' => now(),
                'updated_at' => now(),
            ]
        );

        if (DB::getDriverName() === 'pgsql') {
            DB::statement(
                "SELECT setval(pg_get_serial_sequence('document_statuses', 'status_id'), (SELECT MAX(status_id) FROM document_statuses))"
            );
        }
    }

    public function down(): void
    {
        DB::table('document_statuses')->where('status_id', 5)->delete();

        Schema::table('documents', function (Blueprint $table) {
            $table->dropForeign(['archived_by']);
            $table->dropColumn(['archived_at', 'archived_by']);
        });
    }
};