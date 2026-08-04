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
        Schema::create('tracking_histories', function (Blueprint $table) {

            $table->id('tracking_history_id');

            // Document
            $table->foreignId('document_id')
                ->constrained('documents', 'document_id')
                ->cascadeOnUpdate()
                ->cascadeOnDelete();

            // From Section
            $table->foreignId('from_section_id')
                ->nullable()
                ->constrained('sections', 'section_id')
                ->nullOnDelete();

            // To Section
            $table->foreignId('to_section_id')
                ->nullable()
                ->constrained('sections', 'section_id')
                ->nullOnDelete();

            // Employee who performed the action
            $table->foreignId('employee_id')
                ->constrained('employees_acc', 'employee_id')
                ->cascadeOnUpdate()
                ->restrictOnDelete();

            // Current Status
            $table->foreignId('status_id')
                ->constrained('document_statuses', 'status_id')
                ->cascadeOnUpdate()
                ->restrictOnDelete();

            // Action
            $table->string('action', 50);

            // Remarks
            $table->text('remarks')->nullable();

            // Exact Date & Time
            $table->timestamp('tracked_at')->useCurrent();

            $table->timestamps();

            /*
            |--------------------------------------------------------------------------
            | Indexes
            |--------------------------------------------------------------------------
            */

            $table->index('document_id');
            $table->index('employee_id');
            $table->index('status_id');
            $table->index('from_section_id');
            $table->index('to_section_id');
            $table->index('tracked_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tracking_histories');
    }
};