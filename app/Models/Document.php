<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

class Document extends Model
{
    protected $primaryKey = 'document_id';

    protected $fillable = [
        'tracking_number',
        'document_date',
        'taxpayer_name',
        'transaction_type',
        'concern',
        'referred_for',
        'remarks',
        'description',
        'reference_number',

        'status_id',

        'current_section_id',
        'current_employee_id',
        'destination_section_id',
        'addressee',

        'created_by',
        'office_code',

        'received_at',
        'completed_at',

        'qr_value',
        'qr_path',
        'qr_generated_at',
    ];

    /*
    * Every screen that lists documents needs to know how long each one
    * has been waiting and whether that is a problem, so both travel
    * with the document wherever it is serialised.
    */
    protected $appends = [
        'waiting_since',
        'aging',
    ];

    protected $casts = [
        'document_date' => 'date',
        'received_at' => 'datetime',
        'completed_at' => 'datetime',
        'qr_generated_at' => 'datetime',
    ];

    public function status(): BelongsTo
    {
        return $this->belongsTo(
            DocumentStatus::class,
            'status_id',
            'status_id'
        );
    }

    public function currentSection(): BelongsTo
    {
        return $this->belongsTo(
            Section::class,
            'current_section_id',
            'section_id'
        );
    }

    public function destinationSection(): BelongsTo
    {
        return $this->belongsTo(
            Section::class,
            'destination_section_id',
            'section_id'
        );
    }

    public function currentEmployee(): BelongsTo
    {
        return $this->belongsTo(
            EmployeeAcc::class,
            'current_employee_id',
            'employee_id'
        );
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(
            EmployeeAcc::class,
            'created_by',
            'employee_id'
        );
    }

    public function trackingHistories(): HasMany
    {
        return $this->hasMany(
            TrackingHistory::class,
            'document_id',
            'document_id'
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Aging
    |--------------------------------------------------------------------------
    */

    /**
     * When the document last changed hands - the moment its current
     * wait began.
     *
     * Draft: since the QR was generated in Step 1 — before any
     *   referral detail existed. This is the whole point of timing
     *   the QR generation separately: it shows exactly how long
     *   Step 2 has been sitting untouched.
     * Pending: since it was last forwarded, or registered if never.
     * Received: since the current holder received it.
     */
    public function getWaitingSinceAttribute(): ?Carbon
    {
        if ((int) $this->status_id === 3) {
            return $this->completed_at;
        }

        if ((int) $this->status_id === 2) {
            return $this->received_at;
        }

        if ((int) $this->status_id === 0) {
            return $this->qr_generated_at ?? $this->created_at;
        }

        $lastMove = $this->relationLoaded('latestTrackingHistory')
            ? $this->latestTrackingHistory
            : $this->latestTrackingHistory()->first();

        return $lastMove?->tracked_at ?? $this->created_at;
    }

    /**
     * How the current wait compares to the office's two-day target.
     *
     * Returns the band name, the hours waited, and whether it has
     * passed the overdue line, so the frontend only has to colour it.
     */
    public function getAgingAttribute(): ?array
    {
        /*
        * A draft and a pending document are both waiting on someone —
        * a draft on whoever completes Step 2, a pending one on the
        * destination section. Once received, the office considers the
        * clock stopped - the exact times stay in the history, but no
        * badge nags the holder.
        */
        if (! in_array((int) $this->status_id, [0, 1], true)) {
            return null;
        }

        $since = $this->waiting_since;

        if (! $since) {
            return ['band' => 'fresh', 'hours' => 0, 'overdue' => false];
        }

        $hours = $since->diffInMinutes(now()) / 60;
        $limits = config('referral.aging');

        $band = match (true) {
            $hours < $limits['fresh_until'] => 'fresh',
            $hours < $limits['aging_until'] => 'aging',
            default => 'late',
        };

        return [
            'band' => $band,
            'hours' => round($hours, 1),
            'overdue' => $hours >= $limits['overdue_after'],
        ];
    }

    public function latestTrackingHistory()
    {
        return $this->hasOne(
            TrackingHistory::class,
            'document_id',
            'document_id'
        )->latestOfMany('tracked_at');
    }
}