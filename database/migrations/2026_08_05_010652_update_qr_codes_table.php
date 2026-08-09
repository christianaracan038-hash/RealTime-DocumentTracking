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
        Schema::table('qr_codes', function (Blueprint $table) {

            $table->renameColumn('barcode_value', 'qr_value');

            $table->renameColumn('barcode_type', 'qr_type');

            $table->string('qr_path')->nullable()->after('qr_type');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
         Schema::table('qr_codes', function (Blueprint $table) {

            $table->renameColumn('qr_value', 'barcode_value');

            $table->renameColumn('qr_type', 'barcode_type');

            $table->dropColumn('qr_path');
        });
    }
};
