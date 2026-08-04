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
        Schema::create('employees_acc', function (Blueprint $table) {
            $table->id('employee_id');

            $table->string('username', 50)->unique();
            $table->string('password');

            $table->foreignId('section_id')
                ->references('section_id')
                ->on('sections')
                ->cascadeOnUpdate()
                ->restrictOnDelete();

            $table->foreignId('role_id')
                ->references('role_id')
                ->on('roles')
                ->cascadeOnUpdate()
                ->restrictOnDelete();

            $table->boolean('is_active')->default(true);

            $table->timestamp('last_login')->nullable();

            $table->rememberToken();

            $table->timestamps();

            $table->index('username');
            $table->index('section_id');
            $table->index('role_id');
            $table->index('is_active');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('employees_acc');
    }
};