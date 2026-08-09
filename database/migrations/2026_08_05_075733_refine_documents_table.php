<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('documents', function (Blueprint $table) {

            $table->dropColumn([
                'document_title',
                'priority',
                'is_confidential',
            ]);

        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('documents', function (Blueprint $table) {

            $table->string('document_title', 255);

            $table->enum('priority', [
                'Low',
                'Normal',
                'High',
                'Urgent',
            ])->default('Normal');

            $table->boolean('is_confidential')->default(false);

        });
    }
};