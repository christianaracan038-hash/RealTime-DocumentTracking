<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;
use App\Models\TrackingHistory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;
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
        'details_completed_at',
        'details_completed_by',

        'qr_value',
        'qr_path',
        'qr_generated_at',
        'archived_at',
        'archived_by',


        'deletion_requested_at',
        'deletion_requested_by',
        'deletion_reason',
        'deletion_approved_at',
        'deletion_approved_by',
    ];

    /*
    * Every screen that lists documents needs to know how long each one
    * has been waiting and whether that is a problem, so both travel
    * with the document wherever it is serialised.
    */
    protected $appends = [
        'waiting_since',
        'aging',
        'awaiting_details',
        'delay_reason', 
    ];

    protected $casts = [
        'document_date' => 'date',
        'received_at' => 'datetime',
        'completed_at' => 'datetime',
        'details_completed_at' => 'datetime',
        'qr_generated_at' => 'datetime',
        'archived_at' => 'datetime',
        'deletion_requested_at' => 'datetime',
        'deletion_approved_at' => 'datetime',
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

    /**
     * Whether step 2 - the referral's details - is still outstanding.
     *
     * A referral awaiting its details is still Pending and can still be
     * received and forwarded; only the paperwork is unfinished.
     */
    public function getAwaitingDetailsAttribute(): bool
    {
        return $this->details_completed_at === null;
    }

    /**
     * Whoever filled in the details, which is usually not the person
     * who registered the arrival.
     */
    public function detailsCompletedBy(): BelongsTo
    {
        return $this->belongsTo(
            EmployeeAcc::class,
            'details_completed_by',
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

    /**
     * Notes the RDO has left about this document.
     */
    public function comments(): HasMany
    {
        return $this->hasMany(
            DocumentComment::class,
            'document_id',
            'document_id'
        )->latest('created_at');
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
     * How the current wait compares to the office's overdue target.
     *
     * Returns the band name, the hours waited, and whether it has
     * passed the overdue line, so the frontend only has to colour it.
     */
    public function getAgingAttribute(): ?array
    {
        /*
        * A draft and a pending document are waiting on someone, and a
        * received document is waiting on its holder to act. The clock
        * for a received document runs from received_at, so every new
        * forward and receive starts a fresh count.
        */
        if (! in_array((int) $this->status_id, [0, 1, 2], true)) {
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

    public function isCommentable(): bool
    {
        if (! in_array((int) $this->status_id, [1, 2], true)) {
            return false;
        }

        $since = $this->waiting_since;

        return $since !== null
            && $since->diffInMinutes(now()) / 60 >= config('referral.aging.overdue_after');
    }

    public function latestTrackingHistory()
    {
        return $this->hasOne(
            TrackingHistory::class,
            'document_id',
            'document_id'
        )->latestOfMany('tracked_at');
    }

    public function requester()
    {
        return $this->belongsTo(EmployeeAcc::class, 'deletion_requested_by', 'employee_id');
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'deletion_approved_by', 'id');
    }

    /**
     * Pinakabagong delay reason ng document, galing sa document_comments
     * na may type = 'delay_notice'.
     */
    public function getDelayReasonAttribute(): ?array
    {
        $comments = $this->relationLoaded('comments')
            ? $this->comments
            : $this->comments()->get();

        $comment = $comments
            ->where('type', DocumentComment::TYPE_DELAY_NOTICE)
            ->sortByDesc('created_at')
            ->first();

        if (! $comment) {
            return null;
        }

        $now = now();
        $days = $comment->created_at ? (int) $comment->created_at->diffInDays($now) : 0;

        return [
            'id' => $comment->comment_id,
            'body' => $comment->body,
            'author_id' => $comment->author_id,
            'author' => $comment->author?->username,
            'author_name' => $comment->author?->full_name ?? $comment->author?->username,
            'created_at' => $comment->created_at?->toISOString() ?? (string) $comment->created_at,
            'days' => $days,
            'acknowledged' => $comment->acknowledged_at !== null,
        ];
    }

    /**
     * Scope to count overdue documents for a section.
     *
     * A document is overdue when its latest movement is older than
     * config('referral.aging.overdue_after') hours, or when it has
     * never moved (null tracking history).
     */
    public function scopeOverdue(
        Builder $query,
        int $sectionId,
        ?int $overdueHours = null
    ): Builder {
        $overdueHours = $overdueHours ?? config('referral.aging.overdue_after', 48);
        $cutoff = now()->subHours($overdueHours);

        return $query
            ->where('documents.destination_section_id', $sectionId)
            ->whereIn('documents.status_id', [1, 5])
            ->leftJoinSub(
                TrackingHistory::query()
                    ->select('document_id', DB::raw('MAX(tracked_at) as tracked_at'))
                    ->groupBy('document_id'),
                'latest_th',
                'latest_th.document_id',
                '=',
                'documents.document_id'
            )
            ->where(function ($q) use ($cutoff) {
                $q->whereNull('latest_th.tracked_at')
                    ->orWhere('latest_th.tracked_at', '<', $cutoff);
            });
    }

    public function scopeVisibleTo(Builder $query, EmployeeAcc $employee): Builder
    {
        return $query->whereHas(
            'creator',
            fn ($creator) => $creator->whereIn('section_id', $employee->visibleSectionIds())
        );
    }
}
