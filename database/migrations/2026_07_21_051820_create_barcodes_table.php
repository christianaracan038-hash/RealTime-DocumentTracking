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
        Schema::create('barcodes', function (Blueprint $table) {

            $table->id('barcode_id');

            $table->foreignId('document_id')
                ->constrained('documents', 'document_id')
                ->cascadeOnUpdate()
                ->cascadeOnDelete();

            $table->string('barcode_value')->unique();

            $table->string('barcode_type', 30)->default('Code128');

            $table->timestamp('generated_at')->useCurrent();

            $table->timestamps();

            $table->unique('document_id');

            $table->index('barcode_value');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('barcodes');
    }
};