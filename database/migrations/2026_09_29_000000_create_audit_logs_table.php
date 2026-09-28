<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Who did what, and when.
 *
 * tracking_histories records what happened to a document. Nothing has
 * ever recorded what happened to the *system*: who signed in, who failed
 * to, who created an account, who switched one off, who renamed a
 * section. For a government office with restricted access that is the
 * first thing an auditor asks for, and it can only ever answer for the
 * period after it existed.
 *
 * Deliberately not foreign-keyed to the accounts it names. An audit log
 * that loses its entries when somebody is deleted is not an audit log -
 * so the actor and the subject are recorded by id AND by the label they
 * had at the time, and the row survives them both.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id('audit_log_id');

            /*
            * A dotted name: 'login.failed', 'employee.deactivated'. The
            * prefix is what was acted on, the suffix is what happened.
            */
            $table->string('action', 60);

            /*
            * Who did it. 'admin' or 'employee' - or null for something
            * nobody was signed in for, which is what a failed login is.
            */
            $table->string('actor_type', 20)->nullable();
            $table->unsignedBigInteger('actor_id')->nullable();
            $table->string('actor_label')->nullable();

            // What it was done to, named the same way.
            $table->string('subject_type', 20)->nullable();
            $table->unsignedBigInteger('subject_id')->nullable();
            $table->string('subject_label')->nullable();

            /*
            * Anything else worth keeping - which fields changed, the
            * username somebody guessed at. Never a password, not even a
            * wrong one.
            */
            $table->json('context')->nullable();

            $table->string('ip', 45)->nullable();
            $table->string('user_agent', 255)->nullable();

            $table->timestamp('created_at')->useCurrent();

            /*
            * The log is read newest-first, and filtered by what happened
            * or by who did it.
            */
            $table->index('created_at');
            $table->index('action');
            $table->index(['actor_type', 'actor_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
    }
};
