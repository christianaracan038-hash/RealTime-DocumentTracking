<?php

namespace Tests\Feature\Documents;

use App\Models\Document;
use App\Models\DocumentStatus;
use App\Models\EmployeeAcc;
use App\Models\Role;
use App\Models\Section;
use App\Services\DocumentService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DocumentSearchTest extends TestCase
{
    use RefreshDatabase;

    protected EmployeeAcc $employee;

    protected function setUp(): void
    {
        parent::setUp();

        DocumentStatus::create([
            'status_name' => 'Pending',
            'status_color' => 'yellow',
            'description' => 'Document has been registered.',
            'sort_order' => 1,
        ]);

        $section = Section::create([
            'section_code' => 'RDO',
            'section_name' => 'RDO',
            'description' => 'Revenue District Office',
            'is_active' => true,
        ]);

        $role = Role::create([
            'role_name' => 'Staff',
            'description' => 'Staff',
            'is_active' => true,
        ]);

        $this->employee = EmployeeAcc::create([
            'username' => 'rdo.staff',
            'password' => 'password',
            'section_id' => $section->section_id,
            'role_id' => $role->role_id,
            'is_active' => true,
        ]);
    }

    protected function makeDocument(string $taxpayer, string $type): Document
    {
        return Document::create([
            'tracking_number' => 'DOC-'.fake()->unique()->numerify('########'),
            'document_date' => now()->toDateString(),
            'taxpayer_name' => $taxpayer,
            'transaction_type' => $type,
            'description' => 'Test document',
            'status_id' => 1,
            'current_section_id' => $this->employee->section_id,
            'current_employee_id' => $this->employee->employee_id,
            'destination_section_id' => $this->employee->section_id,
            'created_by' => $this->employee->employee_id,
        ]);
    }

    public function test_it_finds_a_taxpayer_sitting_beyond_the_first_page(): void
    {
        /*
        * History paginates 10 per page. Create 25 filler documents so the
        * target lands well past page 1, which is exactly the case the old
        * client-side filter could not reach.
        */
        foreach (range(1, 25) as $i) {
            $this->makeDocument('Filler Taxpayer '.$i, 'Tax Clearance');
        }

        $target = $this->makeDocument('Juan Dela Cruz', 'Tax Return / Filing');

        $results = app(DocumentService::class)
            ->getHistoryDocuments($this->employee, 'juan dela cruz');

        $this->assertCount(1, $results->items());

        $this->assertSame(
            $target->document_id,
            $results->items()[0]->document_id
        );
    }

    public function test_it_matches_taxpayer_name_case_insensitively(): void
    {
        $this->makeDocument('MARIA SANTOS', 'Assessment');

        foreach (['maria santos', 'MARIA', 'santos', 'RiA SaN'] as $keyword) {
            $results = app(DocumentService::class)
                ->getHistoryDocuments($this->employee, $keyword);

            $this->assertCount(
                1,
                $results->items(),
                "Expected a match for keyword [{$keyword}]."
            );
        }
    }

    public function test_it_matches_transaction_type(): void
    {
        $this->makeDocument('Juan Dela Cruz', 'Tax Clearance');
        $this->makeDocument('Maria Santos', 'Assessment');

        $results = app(DocumentService::class)
            ->getHistoryDocuments($this->employee, 'tax clearance');

        $this->assertCount(1, $results->items());

        $this->assertSame(
            'Juan Dela Cruz',
            $results->items()[0]->taxpayer_name
        );
    }

    public function test_an_empty_keyword_returns_everything_visible(): void
    {
        $this->makeDocument('Juan Dela Cruz', 'Tax Clearance');
        $this->makeDocument('Maria Santos', 'Assessment');

        $results = app(DocumentService::class)
            ->getHistoryDocuments($this->employee, '');

        $this->assertSame(2, $results->total());
    }

    public function test_a_non_matching_keyword_returns_nothing(): void
    {
        $this->makeDocument('Juan Dela Cruz', 'Tax Clearance');

        $results = app(DocumentService::class)
            ->getHistoryDocuments($this->employee, 'nobody by that name');

        $this->assertSame(0, $results->total());
    }
}
