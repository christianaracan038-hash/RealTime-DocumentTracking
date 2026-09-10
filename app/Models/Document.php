<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Document extends Model
{
    protected $primaryKey = 'document_id';

    protected $fillable = [
        'tracking_number',
        'document_date',
        'taxpayer_name',
        'transaction_type',
        'description',
        'reference_number',

        'status_id',

        'current_section_id',
        'current_employee_id',
        'destination_section_id',

        'created_by',

        'received_at',
        'completed_at',

        'qr_value',
        'qr_path',
        'qr_generated_at',
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

    public function latestTrackingHistory()
    {
        return $this->hasOne(
            TrackingHistory::class,
            'document_id',
            'document_id'
        )->latestOfMany('tracked_at');
    }
}
