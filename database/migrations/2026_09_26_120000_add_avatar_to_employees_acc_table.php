<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * A photograph of whoever an account belongs to.
 *
 * Stores the path on whichever disk config('filesystems.avatars') names,
 * not a URL, so moving from a local folder to Supabase Storage - or to a
 * real server later - is a change of configuration and not a rewrite of
 * every row.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasColumn('employees_acc', 'avatar_path')) {
            return;
        }

        Schema::table('employees_acc', function (Blueprint $table) {
            $table->string('avatar_path')->nullable()->after('email');
        });
    }

    public function down(): void
    {
        if (! Schema::hasColumn('employees_acc', 'avatar_path')) {
            return;
        }

        Schema::table('employees_acc', function (Blueprint $table) {
            $table->dropColumn('avatar_path');
        });
    }
};
