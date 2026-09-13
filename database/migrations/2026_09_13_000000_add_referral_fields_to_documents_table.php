<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Registration now follows BIR Form 2309 (Reference Slip). These are
 * the fields on that slip that the documents table did not yet hold.
 *
 * Every step checks before it acts so the migration is safe to run on
 * a database another branch may already have touched.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('documents', function (Blueprint $table) {

            // What the referral is about (from config/referral.php).
            if (! Schema::hasColumn('documents', 'concern')) {
                $table->string('concern', 150)->nullable()->after('taxpayer_name');
            }

            // What the receiving office is asked to do - the "FOR" block.
            if (! Schema::hasColumn('documents', 'referred_for')) {
                $table->string('referred_for', 50)->nullable()->after('concern');
            }

            // Free text: complied / completed, or why not yet.
            if (! Schema::hasColumn('documents', 'remarks')) {
                $table->text('remarks')->nullable()->after('referred_for');
            }

            // Who in the receiving section: "Chief" or "Authorized & Chief".
            if (! Schema::hasColumn('documents', 'addressee')) {
                $table->string('addressee', 40)->nullable()->after('destination_section_id');
            }

            /*
            * The sending section's code, copied at registration so the
            * printed slip does not change if the section is later
            * recoded.
            */
            if (! Schema::hasColumn('documents', 'office_code')) {
                $table->string('office_code', 20)->nullable()->after('created_by');
            }

        });

        Schema::table('documents', function (Blueprint $table) {

            if (! Schema::hasIndex('documents', ['concern'])) {
                $table->index('concern');
            }

        });
    }

    public function down(): void
    {
        Schema::table('documents', function (Blueprint $table) {

            if (Schema::hasIndex('documents', ['concern'])) {
                $table->dropIndex(['concern']);
            }

            $columns = array_filter(
                ['concern', 'referred_for', 'remarks', 'addressee', 'office_code'],
                fn ($column) => Schema::hasColumn('documents', $column)
            );

            if ($columns) {
                $table->dropColumn(array_values($columns));
            }

        });
    }
};
