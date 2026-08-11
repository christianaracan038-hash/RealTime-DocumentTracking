<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TrackingHistory extends Model
{
    protected $primaryKey = 'tracking_history_id';

    protected $fillable = [
        'document_id',
        'from_section_id',
        'to_section_id',
        'employee_id',
        'status_id',
        'action',
        'remarks',
        'tracked_at',
    ];

    protected $casts = [
        'tracked_at' => 'datetime',
    ];

    /**
     * Document
     */
    public function document(): BelongsTo
    {
        return $this->belongsTo(
            Document::class,
            'document_id',
            'document_id'
        );
    }

    /**
     * From Section
     */
    public function fromSection(): BelongsTo
    {
        return $this->belongsTo(
            Section::class,
            'from_section_id',
            'section_id'
        );
    }

    /**
     * To Section
     */
    public function toSection(): BelongsTo
    {
        return $this->belongsTo(
            Section::class,
            'to_section_id',
            'section_id'
        );
    }

    /**
     * Employee who performed the action
     */
    public function employee(): BelongsTo
    {
        return $this->belongsTo(
            EmployeeAcc::class,
            'employee_id',
            'employee_id'
        );
    }

    /**
     * Status
     */
    public function status(): BelongsTo
    {
        return $this->belongsTo(
            DocumentStatus::class,
            'status_id',    
            'status_id'
        );
    }
}