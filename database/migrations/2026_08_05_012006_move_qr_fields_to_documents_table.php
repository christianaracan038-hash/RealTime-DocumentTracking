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

            // QR Code Information
            $table->string('qr_value')->unique()->nullable()->after('tracking_number');


            $table->timestamp('qr_generated_at')->nullable()->after('qr_path');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
         Schema::table('documents', function (Blueprint $table) {

            $table->dropColumn([
                'qr_value',
                'qr_generated_at',
            ]);
        });
    }
};
