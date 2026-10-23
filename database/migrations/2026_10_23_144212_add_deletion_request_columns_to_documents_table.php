<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('documents', function (Blueprint $table) {
            if (! Schema::hasColumn('documents', 'deletion_requested_at')) {
                $table->timestamp('deletion_requested_at')->nullable();
            }

            if (! Schema::hasColumn('documents', 'deletion_requested_by')) {
                $table->unsignedBigInteger('deletion_requested_by')->nullable();
            }

            if (! Schema::hasColumn('documents', 'deletion_reason')) {
                $table->text('deletion_reason')->nullable();
            }
        });
    }

    public function down(): void
    {
        Schema::table('documents', function (Blueprint $table) {
            $table->dropColumn([
                'deletion_requested_at',
                'deletion_requested_by',
                'deletion_reason',
            ]);
        });
    }
};