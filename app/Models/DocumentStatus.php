<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DocumentStatus extends Model
{
    /**
     * Primary Key
     */
    protected $primaryKey = 'status_id';

    /**
     * Mass Assignable
     */
    protected $fillable = [
        'status_name',
        'status_color',
        'description',
        'is_active',
        'sort_order',
    ];
}
