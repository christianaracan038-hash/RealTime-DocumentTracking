<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Concerns and For now allow several ticks plus free text under
 * "Other", stored as one comma-separated line. The original string
 * columns were sized for a single choice.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('documents', function (Blueprint $table) {
            $table->text('concern')->nullable()->change();
            $table->text('referred_for')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('documents', function (Blueprint $table) {
            $table->string('concern', 150)->nullable()->change();
            $table->string('referred_for', 50)->nullable()->change();
        });
    }
};
