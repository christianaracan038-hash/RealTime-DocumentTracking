<?php

namespace Tests\Feature\Documents;

use App\Models\Document;
use App\Models\DocumentStatus;
use App\Models\EmployeeAcc;
use App\Models\Role;
use App\Models\Section;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

/**
 * QR images are files on one machine's disk while the database is
 * shared, so a document registered elsewhere arrives with no image.
 * The QR route has to rebuild it rather than serve a broken picture.
 */
class DocumentQrTest extends TestCase
{
    use RefreshDatabase;

    protected EmployeeAcc $employee;

    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake('public');

        DocumentStatus::create(['status_name' => 'Pending', 'status_color' => 'yellow', 'sort_order' => 1]);

        $section = Section::create(['section_code' => 'RDO', 'section_name' => 'RDO', 'is_active' => true]);
        $role = Role::create(['role_name' => 'Staff', 'is_active' => true]);

        $this->employee = EmployeeAcc::create([
            'username' => 'rdo.staff',
            'password' => 'password',
            'section_id' => $section->section_id,
            'role_id' => $role->role_id,
            'is_active' => true,
        ]);
    }

    protected function makeDocument(): Document
    {
        return Document::create([
            'tracking_number' => 'DOC-20260913-000001',
            'qr_value' => 'DOC-20260913-000001',
            'document_date' => now()->toDateString(),
            'taxpayer_name' => 'Juan Dela Cruz',
            'transaction_type' => 'Tax Clearance',
            'description' => 'Test document',
            'status_id' => 1,
            'current_section_id' => $this->employee->section_id,
            'current_employee_id' => $this->employee->employee_id,
            'destination_section_id' => $this->employee->section_id,
            'created_by' => $this->employee->employee_id,
        ]);
    }

    public function test_it_rebuilds_a_qr_image_that_is_missing_from_this_machine(): void
    {
        $document = $this->makeDocument();

        Storage::disk('public')->assertMissing('qrcodes/'.$document->qr_value.'.svg');

        $response = $this->actingAs($this->employee, 'employee')
            ->get(route('documents.qr', $document->document_id))
            ->assertOk()
            ->assertHeader('Content-Type', 'image/svg+xml');

        $svg = $response->getContent();

        $this->assertStringContainsString('<svg', $svg);
        $this->assertStringContainsString('viewBox', $svg);

        Storage::disk('public')->assertExists('qrcodes/'.$document->qr_value.'.svg');
    }

    public function test_it_serves_the_stored_image_when_one_exists(): void
    {
        $document = $this->makeDocument();

        Storage::disk('public')->put(
            'qrcodes/'.$document->qr_value.'.svg',
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1">stored</svg>'
        );

        $response = $this->actingAs($this->employee, 'employee')
            ->get(route('documents.qr', $document->document_id))
            ->assertOk();

        $this->assertStringContainsString(
            'stored',
            $response->getContent(),
            'An existing image should be served, not rebuilt.'
        );
    }

    public function test_the_qr_image_is_closed_to_guests(): void
    {
        $document = $this->makeDocument();

        $this->get(route('documents.qr', $document->document_id))
            ->assertRedirect('/login');
    }
}
