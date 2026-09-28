<?php

namespace App\Console\Commands;

use App\Models\Document;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

/**
 * Remove archived documents that are older than the office's retention
 * period.
 *
 * Deliberately narrow. Only documents the office itself closed out as
 * unresponsive (status 4) are eligible: a completed referral is the
 * record that a transaction happened and is not ours to throw away, and
 * anything still moving is live work. Nothing is deleted without
 * --force, and the command prints what it would remove first.
 *
 * This is housekeeping, not a performance fix. A crowded table is slow
 * because of how it is queried, not because it is large - see the
 * indexes added in 2026_09_26_000000_add_workflow_indexes.
 */
class PruneArchivedDocuments extends Command
{
    protected $signature = 'documents:prune
                            {--years=5 : Only archived documents older than this}
                            {--force : Actually delete. Without it, nothing is touched}';

    protected $description = 'Delete long-archived documents and their trail';

    public function handle(): int
    {
        $years = max(1, (int) $this->option('years'));

        $before = now()->subYears($years);

        $documents = Document::query()
            ->where('status_id', 4)
            ->where('updated_at', '<', $before)
            ->get(['document_id', 'tracking_number', 'taxpayer_name', 'qr_path', 'updated_at']);

        if ($documents->isEmpty()) {
            $this->info("Nothing archived before {$before->toFormattedDateString()}.");

            return self::SUCCESS;
        }

        $this->table(
            ['Reference no.', 'Taxpayer', 'Archived'],
            $documents->map(fn (Document $document) => [
                $document->tracking_number,
                $document->taxpayer_name,
                $document->updated_at?->toFormattedDateString(),
            ])
        );

        if (! $this->option('force')) {
            $this->warn(
                $documents->count().' document(s) would be deleted, with their '.
                'movement trail and comments. Re-run with --force to do it.'
            );

            return self::SUCCESS;
        }

        $ids = $documents->pluck('document_id');

        /*
        * The children first, then the document, all or nothing. The
        * foreign keys would cascade on most of these, but doing it
        * explicitly means the count reported is the count deleted.
        */
        DB::transaction(function () use ($ids) {
            DB::table('document_comments')->whereIn('document_id', $ids)->delete();
            DB::table('tracking_histories')->whereIn('document_id', $ids)->delete();
            Document::whereIn('document_id', $ids)->delete();
        });

        // The QR image is no longer reachable once the document is gone.
        $documents
            ->pluck('qr_path')
            ->filter()
            ->each(fn (string $path) => Storage::disk('public')->delete($path));

        $this->info($documents->count().' archived document(s) deleted.');

        return self::SUCCESS;
    }
}
