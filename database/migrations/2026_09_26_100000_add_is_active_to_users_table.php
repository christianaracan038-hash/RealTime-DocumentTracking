<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * An off switch for an administrator account.
 *
 * employees_acc has had is_active since the beginning; users never did,
 * so the only way to revoke an administrator was to delete the row. That
 * matters at handover: the developers' accounts have to be switched off
 * when the office takes the system over, and deleting them would take
 * their audit trail with them.
 *
 * Defaults to true so every existing administrator keeps working.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasColumn('users', 'is_active')) {
            return;
        }

        Schema::table('users', function (Blueprint $table) {
            $table->boolean('is_active')->default(true)->after('password');
        });
    }

    public function down(): void
    {
        if (! Schema::hasColumn('users', 'is_active')) {
            return;
        }

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('is_active');
        });
    }
};
