<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * A note the RDO left on a document that has stopped moving.
 *
 * Addressed to the section holding the document at the time. Separate
 * from tracking_histories: that records what happened to the document,
 * this is correspondence about it.
 */
class DocumentComment extends Model
{
    protected $primaryKey = 'comment_id';

    protected $fillable = [
        'document_id',
        'author_id',
        'to_section_id',
        'body',
        'acknowledged_at',
        'acknowledged_by',
    ];

    protected $casts = [
        'acknowledged_at' => 'datetime',
    ];

    protected $appends = [
        'acknowledged',
    ];

    public function getAcknowledgedAttribute(): bool
    {
        return $this->acknowledged_at !== null;
    }

    public function document(): BelongsTo
    {
        return $this->belongsTo(Document::class, 'document_id', 'document_id');
    }

    public function author(): BelongsTo
    {
        return $this->belongsTo(EmployeeAcc::class, 'author_id', 'employee_id');
    }

    public function toSection(): BelongsTo
    {
        return $this->belongsTo(Section::class, 'to_section_id', 'section_id');
    }

    public function acknowledgedBy(): BelongsTo
    {
        return $this->belongsTo(EmployeeAcc::class, 'acknowledged_by', 'employee_id');
    }
}
