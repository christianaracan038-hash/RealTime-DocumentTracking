<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        /*
        |--------------------------------------------------------------------------
        | Rename current_holder
        |--------------------------------------------------------------------------
        */

        if (Schema::hasColumn('documents', 'current_holder')) {

            Schema::table('documents', function (Blueprint $table) {
                $table->renameColumn('current_holder', 'current_employee_id');
            });
        }

        /*
        |--------------------------------------------------------------------------
        | Add QR Fields
        |--------------------------------------------------------------------------
        */

        Schema::table('documents', function (Blueprint $table) {

            if (! Schema::hasColumn('documents', 'qr_value')) {
                $table->string('qr_value', 255)
                    ->unique()
                    ->nullable()
                    ->after('tracking_number');
            }

            if (! Schema::hasColumn('documents', 'qr_generated_at')) {
                $table->timestamp('qr_generated_at')
                    ->nullable()
                    ->after('qr_path');
            }
        });
    }

    public function down(): void
    {
        Schema::table('documents', function (Blueprint $table) {

            if (Schema::hasColumn('documents', 'current_employee_id')) {
                $table->renameColumn('current_employee_id', 'current_holder');
            }

            if (Schema::hasColumn('documents', 'qr_value')) {
                $table->dropColumn('qr_value');
            }

            if (Schema::hasColumn('documents', 'qr_generated_at')) {
                $table->dropColumn('qr_generated_at');
            }
        });
    }
};