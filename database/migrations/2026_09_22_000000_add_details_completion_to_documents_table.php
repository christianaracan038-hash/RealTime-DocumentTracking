<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Registering a referral is two steps done by two people.
 *
 * Step 1, at the counter the moment the document arrives: the routing
 * facts - taxpayer, where it goes, who it is addressed to - plus the
 * tracking number and QR. This is when the clock starts.
 *
 * Step 2, whenever there is time: the descriptive fields - concerns,
 * what is being asked for, remarks.
 *
 * Whether step 2 is done is tracked here rather than as a status,
 * because it is a property of the paperwork, not of where the document
 * is. A referral awaiting its details is still Pending and can still be
 * received and forwarded, which is the whole point of the split.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('documents', function (Blueprint $table) {

            if (! Schema::hasColumn('documents', 'details_completed_at')) {
                $table->timestamp('details_completed_at')
                    ->nullable()
                    ->after('completed_at');
            }

            if (! Schema::hasColumn('documents', 'details_completed_by')) {
                $table->unsignedBigInteger('details_completed_by')
                    ->nullable()
                    ->after('details_completed_at');
            }

        });

        /*
        * Everything registered before the split was filled in one go,
        * so its details were complete the moment it was created.
        */
        DB::table('documents')
            ->whereNull('details_completed_at')
            ->whereNotNull('concern')
            ->whereNotNull('referred_for')
            ->update([
                'details_completed_at' => DB::raw('created_at'),
                'details_completed_by' => DB::raw('created_by'),
            ]);

        /*
        * Drafts from the earlier two-step attempt used status_id 0,
        * which kept them out of every dashboard and stopped them being
        * forwarded. They are ordinary pending referrals that happen to
        * be missing their details.
        */
        DB::table('documents')->where('status_id', 0)->update(['status_id' => 1]);
    }

    public function down(): void
    {
        Schema::table('documents', function (Blueprint $table) {

            $columns = array_filter(
                ['details_completed_at', 'details_completed_by'],
                fn ($column) => Schema::hasColumn('documents', $column)
            );

            if ($columns) {
                $table->dropColumn(array_values($columns));
            }

        });
    }
};
