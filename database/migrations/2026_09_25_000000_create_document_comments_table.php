<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Notes the RDO leaves on a document that has stopped moving.
 *
 * Most transactions start and end at the RDO, so it is the office that
 * notices when a document has been sitting in another section too long.
 * A comment is addressed to the section holding the document at the
 * time, asking why it is stuck or telling them where it should go next.
 *
 * Kept separate from tracking_histories, which records what actually
 * happened to the document. A comment is correspondence about it.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('document_comments', function (Blueprint $table) {
            $table->id('comment_id');

            $table->foreignId('document_id')
                ->references('document_id')
                ->on('documents')
                ->cascadeOnDelete();

            /*
            * Who wrote it, and which section it is addressed to - the
            * one holding the document when it was written.
            */
            $table->foreignId('author_id')
                ->references('employee_id')
                ->on('employees_acc')
                ->restrictOnDelete();

            $table->foreignId('to_section_id')
                ->references('section_id')
                ->on('sections')
                ->restrictOnDelete();

            $table->text('body');

            /*
            * Set when someone in the receiving section says they have
            * seen it, so the RDO knows the message landed.
            */
            $table->timestamp('acknowledged_at')->nullable();

            $table->foreignId('acknowledged_by')
                ->nullable()
                ->references('employee_id')
                ->on('employees_acc')
                ->nullOnDelete();

            $table->timestamps();

            $table->index('document_id');
            $table->index(['to_section_id', 'acknowledged_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('document_comments');
    }
};
