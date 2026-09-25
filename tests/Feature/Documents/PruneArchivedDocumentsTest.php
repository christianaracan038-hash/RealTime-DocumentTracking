<?php

namespace Tests\Feature\Documents;

use App\Models\Document;
use App\Models\DocumentComment;
use App\Models\DocumentStatus;
use App\Models\EmployeeAcc;
use App\Models\Role;
use App\Models\Section;
use App\Models\TrackingHistory;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Pruning is narrow on purpose: long-archived documents only, and only
 * when told twice. Everything else the office is required to keep.
 */
class PruneArchivedDocumentsTest extends TestCase
{
    use RefreshDatabase;

    protected Section $rdo;

    protected EmployeeAcc $chief;

    protected function setUp(): void
    {
        parent::setUp();

        DocumentStatus::create(['status_name' => 'Pending', 'status_color' => 'yellow', 'sort_order' => 1]);
        DocumentStatus::create(['status_name' => 'Received', 'status_color' => 'green', 'sort_order' => 2]);
        DocumentStatus::create(['status_name' => 'Completed', 'status_color' => 'blue', 'sort_order' => 3]);
        DocumentStatus::create(['status_name' => 'Archived', 'status_color' => 'gray', 'sort_order' => 4]);

        $this->rdo = Section::create(['section_code' => '1002', 'section_name' => 'RDO', 'is_active' => true]);

        $role = Role::create(['role_name' => 'Staff', 'is_active' => true]);

        $this->chief = EmployeeAcc::create([
            'username' => 'rdo.staff', 'password' => 'password',
            'section_id' => $this->rdo->section_id, 'role_id' => $role->role_id, 'is_active' => true,
        ]);
    }

    protected function makeDocument(int $statusId, string $archivedAt): Document
    {
        $document = Document::create([
            'tracking_number' => 'DOC-'.str_pad((string) (Document::count() + 1), 10, '0', STR_PAD_LEFT),
            'qr_value' => 'QR-'.uniqid(),
            'document_date' => '2020-01-01',
            'taxpayer_name' => 'Juan Dela Cruz',
            'concern' => 'Tax Assumption',
            'referred_for' => 'Approval',
            'remarks' => 'Processing',
            'status_id' => $statusId,
            'current_section_id' => $this->rdo->section_id,
            'destination_section_id' => $this->rdo->section_id,
            'created_by' => $this->chief->employee_id,
        ]);

        // updated_at is when it was last touched, so when it was closed out.
        $document->forceFill(['updated_at' => $archivedAt])->saveQuietly();

        return $document;
    }

    public function test_nothing_is_deleted_without_force(): void
    {
        $this->makeDocument(4, '2015-01-01');

        $this->artisan('documents:prune')->assertSuccessful();

        $this->assertSame(1, Document::count());
    }

    public function test_it_deletes_long_archived_documents_with_their_trail(): void
    {
        $old = $this->makeDocument(4, '2015-01-01');

        TrackingHistory::create([
            'document_id' => $old->document_id,
            'from_section_id' => $this->rdo->section_id,
            'to_section_id' => $this->rdo->section_id,
            'employee_id' => $this->chief->employee_id,
            'status_id' => 4,
            'action' => 'ARCHIVED',
            'tracked_at' => '2015-01-01',
        ]);

        DocumentComment::create([
            'document_id' => $old->document_id,
            'author_id' => $this->chief->employee_id,
            'to_section_id' => $this->rdo->section_id,
            'body' => 'Taxpayer never came back.',
        ]);

        $this->artisan('documents:prune --force')->assertSuccessful();

        $this->assertSame(0, Document::count());
        $this->assertSame(0, TrackingHistory::count());
        $this->assertSame(0, DocumentComment::count());
    }

    public function test_a_recently_archived_document_is_kept(): void
    {
        $this->makeDocument(4, now()->subYear()->toDateTimeString());

        $this->artisan('documents:prune --force')->assertSuccessful();

        $this->assertSame(1, Document::count());
    }

    public function test_completed_and_live_documents_are_never_touched(): void
    {
        $this->makeDocument(3, '2015-01-01');  // Completed, and old.
        $this->makeDocument(2, '2015-01-01');  // Received, and forgotten.
        $this->makeDocument(1, '2015-01-01');  // Pending, and forgotten.

        $this->artisan('documents:prune --force')->assertSuccessful();

        $this->assertSame(3, Document::count());
    }

    public function test_the_retention_period_can_be_shortened(): void
    {
        $this->makeDocument(4, now()->subYears(2)->toDateTimeString());

        $this->artisan('documents:prune --years=1 --force')->assertSuccessful();

        $this->assertSame(0, Document::count());
    }
}
