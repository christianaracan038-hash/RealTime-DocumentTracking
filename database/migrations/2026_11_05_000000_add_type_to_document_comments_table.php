<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddTypeToDocumentCommentsTable extends Migration
{
    public function up(): void
    {
        Schema::table('document_comments', function (Blueprint $table) {
            $table->string('type')->default('regular')->after('body');
            $table->index('type');
        });
    }

    public function down(): void
    {
        Schema::table('document_comments', function (Blueprint $table) {
            $table->dropIndex(['type']);
            $table->dropColumn('type');
        });
    }
}