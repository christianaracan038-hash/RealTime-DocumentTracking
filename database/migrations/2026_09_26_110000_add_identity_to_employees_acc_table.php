<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Who an account actually belongs to.
 *
 * employees_acc has only ever had a username, so every screen that names
 * the person handling a document says "rdo.staff" - the comment the RDO
 * left, the movement trail, the audit log we are about to write. An
 * earlier attempt added employee_name and read it back null everywhere,
 * which is why CLAUDE.md warns the column does not exist.
 *
 * Nullable, because nine accounts already exist without names. New
 * accounts require a full name; editing an old one asks for it.
 *
 * `position` is the person's title in the office - "Atty.", "Chief",
 * "Revenue Officer II". It is deliberately NOT the referral's addressee:
 * the printed BIR slip keeps its own fixed list, so no individual's name
 * leaves the office on paper.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('employees_acc', function (Blueprint $table) {
            if (! Schema::hasColumn('employees_acc', 'full_name')) {
                $table->string('full_name')->nullable()->after('username');
            }

            if (! Schema::hasColumn('employees_acc', 'position')) {
                $table->string('position', 100)->nullable()->after('full_name');
            }

            /*
            * For password resets later. Unique where present - Postgres
            * allows any number of nulls in a unique index.
            */
            if (! Schema::hasColumn('employees_acc', 'email')) {
                $table->string('email')->nullable()->unique()->after('position');
            }
        });
    }

    public function down(): void
    {
        Schema::table('employees_acc', function (Blueprint $table) {
            if (Schema::hasColumn('employees_acc', 'email')) {
                $table->dropUnique(['email']);
                $table->dropColumn('email');
            }

            foreach (['position', 'full_name'] as $column) {
                if (Schema::hasColumn('employees_acc', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
