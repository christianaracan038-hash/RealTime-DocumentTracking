<?php

namespace Tests\Feature\Sections;

use App\Models\Document;
use App\Models\DocumentStatus;
use App\Models\EmployeeAcc;
use App\Models\Role;
use App\Models\Section;
use App\Services\DashboardResolver;
use Database\Seeders\SectionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Every section reaches its own dashboard and no one else's.
 *
 * The sections are driven from config/section.php, so these tests walk
 * that config rather than hard-coding a list — a new section added
 * there is covered automatically.
 */
class SectionDashboardTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        DocumentStatus::create(['status_name' => 'Pending', 'status_color' => 'yellow', 'sort_order' => 1]);
        DocumentStatus::create(['status_name' => 'Received', 'status_color' => 'green', 'sort_order' => 2]);

        $this->seed(SectionSeeder::class);

        Role::create(['role_name' => 'Staff', 'is_active' => true]);
    }

    protected function employeeFor(string $sectionName): EmployeeAcc
    {
        $section = Section::where('section_name', $sectionName)->firstOrFail();

        return EmployeeAcc::create([
            'username' => strtolower($sectionName).'.staff',
            'password' => 'password',
            'section_id' => $section->section_id,
            'role_id' => Role::first()->role_id,
            'is_active' => true,
        ]);
    }

    public function test_the_seeder_creates_a_row_for_every_configured_section(): void
    {
        foreach (array_keys(config('section')) as $sectionName) {
            $this->assertDatabaseHas('sections', [
                'section_name' => $sectionName,
                'is_active' => true,
            ]);
        }
    }

    public function test_every_section_can_open_its_own_dashboard(): void
    {
        foreach (config('section') as $sectionName => $dashboard) {

            $this->actingAs($this->employeeFor($sectionName), 'employee')
                ->get(route($dashboard['route']))
                ->assertOk();
        }
    }

    public function test_a_section_cannot_open_another_sections_dashboard(): void
    {
        $employee = $this->employeeFor('CSS');

        foreach (config('section') as $sectionName => $dashboard) {

            if ($sectionName === 'CSS') {
                continue;
            }

            $this->actingAs($employee, 'employee')
                ->get(route($dashboard['route']))
                ->assertForbidden();
        }
    }

    public function test_dashboards_are_closed_to_guests(): void
    {
        foreach (config('section') as $dashboard) {
            $this->get(route($dashboard['route']))->assertRedirect('/login');
        }
    }

    public function test_login_sends_each_employee_to_their_own_dashboard(): void
    {
        foreach (config('section') as $sectionName => $dashboard) {

            $this->assertSame(
                route($dashboard['route']),
                DashboardResolver::resolve($this->employeeFor($sectionName)),
                "{$sectionName} should resolve to {$dashboard['route']}."
            );
        }
    }

    public function test_a_section_with_no_dashboard_configured_resolves_to_nothing(): void
    {
        $orphan = Section::create([
            'section_code' => '9999',
            'section_name' => 'LEGAL',
            'description' => 'Not in config/section.php',
            'is_active' => true,
        ]);

        $employee = EmployeeAcc::create([
            'username' => 'legal.staff',
            'password' => 'password',
            'section_id' => $orphan->section_id,
            'role_id' => Role::first()->role_id,
            'is_active' => true,
        ]);

        $this->assertNull(
            DashboardResolver::resolve($employee),
            'An unconfigured section must not resolve, so login is refused.'
        );
    }

    public function test_a_dashboard_lists_only_documents_pending_for_that_section(): void
    {
        $collection = Section::where('section_name', 'COLLECTION')->first();
        $compliance = Section::where('section_name', 'COMPLIANCE')->first();

        $employee = $this->employeeFor('COLLECTION');

        $mine = $this->makeDocument($employee, $collection, statusId: 1);
        $alreadyReceived = $this->makeDocument($employee, $collection, statusId: 2);
        $someoneElses = $this->makeDocument($employee, $compliance, statusId: 1);

        $response = $this->actingAs($employee, 'employee')
            ->get(route('collection.dashboard'))
            ->assertOk();

        $listed = collect($response->viewData('page')['props']['documents'])
            ->pluck('document_id');

        $this->assertTrue($listed->contains($mine->document_id));
        $this->assertFalse(
            $listed->contains($alreadyReceived->document_id),
            'A received document is no longer pending for this section.'
        );
        $this->assertFalse(
            $listed->contains($someoneElses->document_id),
            'Another section\'s document must not appear.'
        );
    }

    protected function makeDocument(EmployeeAcc $creator, Section $destination, int $statusId): Document
    {
        return Document::create([
            'tracking_number' => 'DOC-20260913-'.str_pad((string) (Document::count() + 1), 6, '0', STR_PAD_LEFT),
            'qr_value' => 'QR-'.uniqid(),
            'document_date' => now()->toDateString(),
            'taxpayer_name' => 'Juan Dela Cruz',
            'transaction_type' => 'Tax Clearance',
            'description' => 'Test document',
            'status_id' => $statusId,
            'current_section_id' => $creator->section_id,
            'current_employee_id' => $creator->employee_id,
            'destination_section_id' => $destination->section_id,
            'created_by' => $creator->employee_id,
        ]);
    }
}
