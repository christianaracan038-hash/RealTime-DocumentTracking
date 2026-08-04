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
        Schema::create('documents', function (Blueprint $table) {

            $table->id('document_id');

            // Tracking Number
            $table->string('tracking_number', 50)->unique();

            // Document Information
            $table->string('document_title', 255);
            $table->text('description')->nullable();

            // Office Reference Number
            $table->string('reference_number', 100)->nullable();

            // Current Status
            $table->string('document_statuses', 50)->default('Pending');

            // Current Section
            $table->foreignId('current_section_id')
                ->nullable()
                ->constrained('sections', 'section_id')
                ->nullOnDelete();

            // User who created the document
            $table->foreignId('created_by')
                ->constrained('employees_acc', 'employee_id')
                ->cascadeOnUpdate()
                ->restrictOnDelete();

            // Priority
            $table->enum('priority', [
                'Low',
                'Normal',
                'High',
                'Urgent'
            ])->default('Normal');

            // Confidential
            $table->boolean('is_confidential')->default(false);

            // Date Received
            $table->timestamp('received_at')->nullable();

            // Date Completed
            $table->timestamp('completed_at')->nullable();

            $table->timestamps();

            /*
            |--------------------------------------------------------------------------
            | Indexes
            |--------------------------------------------------------------------------
            */

            $table->index('tracking_number');
            $table->index('reference_number');
            $table->index('document_statuses');
            $table->index('current_section_id');
            $table->index('created_by');
            $table->index('priority');
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('documents');
    }
};