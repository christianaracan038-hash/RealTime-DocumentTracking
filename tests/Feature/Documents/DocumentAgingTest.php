<?php

namespace Tests\Feature\Documents;

use App\Models\Document;
use App\Models\DocumentStatus;
use App\Models\EmployeeAcc;
use App\Models\Role;
use App\Models\Section;
use App\Models\TrackingHistory;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

/**
 * The office wants every referral moved within two days. Each document
 * reports how long it has been waiting and which colour band that puts
 * it in, so every screen colours it the same way.
 */
class DocumentAgingTest extends TestCase
{
    use RefreshDatabase;

    protected Section $rdo;

    protected Section $assessment;

    protected EmployeeAcc $clerk;

    protected function setUp(): void
    {
        parent::setUp();

        DocumentStatus::create(['status_name' => 'Pending', 'status_color' => 'yellow', 'sort_order' => 1]);
        DocumentStatus::create(['status_name' => 'Received', 'status_color' => 'green', 'sort_order' => 2]);

        $this->rdo = Section::create(['section_code' => '1002', 'section_name' => 'RDO', 'is_active' => true]);
        $this->assessment = Section::create(['section_code' => '1001', 'section_name' => 'ASSESSMENT', 'is_active' => true]);

        $role = Role::create(['role_name' => 'Staff', 'is_active' => true]);

        $this->clerk = EmployeeAcc::create([
            'username' => 'rdo.staff',
            'password' => 'password',
            'section_id' => $this->rdo->section_id,
            'role_id' => $role->role_id,
            'is_active' => true,
        ]);
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();

        parent::tearDown();
    }

    protected function registeredAt(Carbon $when, int $statusId = 1): Document
    {
        Carbon::setTestNow($when);

        $document = Document::create([
            'tracking_number' => 'DOC-'.$when->format('Ymd').'-'.str_pad((string) (Document::count() + 1), 6, '0', STR_PAD_LEFT),
            'qr_value' => 'QR-'.uniqid(),
            'document_date' => $when->toDateString(),
            'taxpayer_name' => 'Juan Dela Cruz',
            'concern' => 'Tax Assumption',
            'referred_for' => 'Approval',
            'remarks' => 'Processing',
            'status_id' => $statusId,
            'current_section_id' => $this->rdo->section_id,
            'current_employee_id' => $this->clerk->employee_id,
            'destination_section_id' => $this->assessment->section_id,
            'addressee' => 'Chief',
            'created_by' => $this->clerk->employee_id,
            'received_at' => $statusId === 2 ? $when : null,
        ]);

        Carbon::setTestNow();

        return $document;
    }

    #[DataProvider('bands')]
    public function test_a_pending_document_is_banded_by_how_long_it_has_waited(
        float $hoursAgo,
        string $band,
        bool $overdue
    ): void {
        $now = Carbon::parse('2026-09-14 11:38:00');

        $document = $this->registeredAt($now->copy()->subHours($hoursAgo));

        Carbon::setTestNow($now);

        $aging = $document->fresh()->aging;

        $this->assertSame($band, $aging['band'], "{$hoursAgo}h should be {$band}.");
        $this->assertSame($overdue, $aging['overdue'], "{$hoursAgo}h overdue flag.");
        $this->assertEqualsWithDelta($hoursAgo, $aging['hours'], 0.1);
    }

    public static function bands(): array
    {
        return [
            'just now' => [0, 'fresh', false],
            'five hours' => [5, 'fresh', false],
            'six hours exactly' => [6, 'aging', false],
            'twelve hours' => [12, 'aging', false],
            'one day exactly' => [24, 'late', false],
            'a day and a half' => [36, 'late', false],
            'two days exactly' => [48, 'late', true],
            'three days' => [72, 'late', true],
        ];
    }

    public function test_the_wait_restarts_when_a_document_is_forwarded(): void
    {
        $registered = Carbon::parse('2026-09-10 09:00:00');
        $forwarded = Carbon::parse('2026-09-14 10:00:00');
        $now = Carbon::parse('2026-09-14 11:38:00');

        // Registered four days ago...
        $document = $this->registeredAt($registered);

        // ...but forwarded on an hour and a half ago.
        TrackingHistory::create([
            'document_id' => $document->document_id,
            'from_section_id' => $this->assessment->section_id,
            'to_section_id' => $this->rdo->section_id,
            'employee_id' => $this->clerk->employee_id,
            'status_id' => 1,
            'action' => 'FORWARDED',
            'remarks' => 'Forwarded.',
            'tracked_at' => $forwarded,
        ]);

        Carbon::setTestNow($now);

        $fresh = $document->fresh(['latestTrackingHistory']);

        $this->assertTrue($fresh->waiting_since->equalTo($forwarded), 'The wait starts at the last forward, not registration.');
        $this->assertSame('fresh', $fresh->aging['band']);
        $this->assertFalse($fresh->aging['overdue']);
    }

    public function test_a_received_document_no_longer_ages(): void
    {
        $now = Carbon::parse('2026-09-14 11:38:00');

        // Received thirty hours ago - would be "late" if it were pending.
        $document = $this->registeredAt($now->copy()->subHours(30), statusId: 2);

        Carbon::setTestNow($now);

        $fresh = $document->fresh();

        $this->assertNull($fresh->aging, 'Once received, the clock stops and no badge is shown.');
        $this->assertTrue(
            $fresh->waiting_since->equalTo($fresh->received_at),
            'The exact receipt time is still available for the history.'
        );
    }

    public function test_aging_travels_with_the_document_to_the_dashboard(): void
    {
        $now = Carbon::parse('2026-09-14 11:38:00');

        $this->registeredAt($now->copy()->subHours(50));

        Carbon::setTestNow($now);

        $receiver = EmployeeAcc::create([
            'username' => 'assessment.staff',
            'password' => 'password',
            'section_id' => $this->assessment->section_id,
            'role_id' => Role::first()->role_id,
            'is_active' => true,
        ]);

        $response = $this->actingAs($receiver, 'employee')
            ->get(route('assessment.dashboard'))
            ->assertOk();

        $listed = $response->viewData('page')['props']['documents'][0];

        $this->assertSame('late', $listed['aging']['band']);
        $this->assertTrue($listed['aging']['overdue']);
        $this->assertNotNull($listed['waiting_since']);
    }

    public function test_the_thresholds_come_from_config(): void
    {
        config(['referral.aging' => ['fresh_until' => 1, 'aging_until' => 2, 'overdue_after' => 3]]);

        $now = Carbon::parse('2026-09-14 11:38:00');

        $document = $this->registeredAt($now->copy()->subHours(2.5));

        Carbon::setTestNow($now);

        $aging = $document->fresh()->aging;

        $this->assertSame('late', $aging['band']);
        $this->assertFalse($aging['overdue']);
    }
}
