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

            /*
            * Taxpayer the document belongs to.
            *
            * Nullable because documents registered before
            * this migration have no taxpayer on record.
            */
            $table->string('taxpayer_name', 255)
                ->nullable()
                ->after('document_date');

            /*
            * Transaction / document type, chosen from
            * config('transaction_types').
            */
            $table->string('transaction_type', 100)
                ->nullable()
                ->after('taxpayer_name');

            /*
            * Both fields are searched directly in the database
            * before pagination, so they are indexed.
            */
            $table->index('taxpayer_name');
            $table->index('transaction_type');

        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('documents', function (Blueprint $table) {

            $table->dropIndex(['taxpayer_name']);
            $table->dropIndex(['transaction_type']);

            $table->dropColumn([
                'taxpayer_name',
                'transaction_type',
            ]);

        });
    }
};
