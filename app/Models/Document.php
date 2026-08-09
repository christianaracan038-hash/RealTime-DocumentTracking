<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Document extends Model
{
    /**
     * Primary Key
     */
    protected $primaryKey = 'document_id';

    /**
     * Mass Assignable
     */
    protected $fillable = [
        'tracking_number',
        'document_date',
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

    /**
     * Casts
     */
    protected $casts = [
        'document_date' => 'date',
        'received_at' => 'datetime',
        'completed_at' => 'datetime',
        'qr_generated_at' => 'datetime',
    ];

    /*
    |--------------------------------------------------------------------------
    | Relationships
    |--------------------------------------------------------------------------
    */

    /**
     * Current Status
     */
    public function status(): BelongsTo
    {
        return $this->belongsTo(DocumentStatus::class, 'status_id', 'status_id');
    }

    /**
     * Current Section
     */
    public function currentSection(): BelongsTo
    {
        return $this->belongsTo(Section::class, 'current_section_id', 'section_id');
    }

    /**
     * Destination Section
     */
    public function destinationSection()
    {
        return $this->belongsTo(
            Section::class,
            'destination_section_id',
            'section_id'
        );
    }

    /**
     * Current Employee Holding the Document
     */
    public function currentEmployee(): BelongsTo
    {
        return $this->belongsTo(EmployeeAcc::class, 'current_employee_id', 'employee_id');
    }

    /**
     * Employee Who Registered the Document
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(EmployeeAcc::class, 'created_by', 'employee_id');
    }

    /**
     * Tracking History
     */
    public function trackingHistories(): HasMany
    {
        return $this->hasMany(
            TrackingHistory::class,
            'document_id',
            'document_id'
        );
    }
}