<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('documents', function (Blueprint $table) {
            $table->date('document_date')->nullable()->change();
            $table->string('taxpayer_name')->nullable()->change();
            $table->string('concern')->nullable()->change();
            $table->string('referred_for')->nullable()->change();
            $table->string('addressee')->nullable()->change();
        });

        // destination_section_id has a foreign key, so it needs its own step.
        Schema::table('documents', function (Blueprint $table) {
            $table->dropForeign(['destination_section_id']);
        });

        Schema::table('documents', function (Blueprint $table) {
            $table->unsignedBigInteger('destination_section_id')
                ->nullable()
                ->change();

            $table->foreign('destination_section_id')
                ->references('section_id')
                ->on('sections')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('documents', function (Blueprint $table) {
            $table->dropForeign(['destination_section_id']);
        });

        Schema::table('documents', function (Blueprint $table) {
            $table->date('document_date')->nullable(false)->change();
            $table->string('taxpayer_name')->nullable(false)->change();
            $table->string('concern')->nullable(false)->change();
            $table->string('referred_for')->nullable(false)->change();
            $table->string('addressee')->nullable(false)->change();
            $table->unsignedBigInteger('destination_section_id')
                ->nullable(false)
                ->change();

            $table->foreign('destination_section_id')
                ->references('section_id')
                ->on('sections');
        });
    }
};