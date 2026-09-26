<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class EmployeeAcc extends Authenticatable
{
    use HasFactory, Notifiable;

    protected $table = 'employees_acc';

    protected $primaryKey = 'employee_id';

    protected $fillable = [
        'username',
        'password',
        'section_id',
        'role_id',
        'is_active',
        'last_login',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'last_login' => 'datetime',
            'is_active' => 'boolean',
            'password' => 'hashed',
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | Relationships
    |--------------------------------------------------------------------------
    */

    public function section()
    {
        return $this->belongsTo(Section::class, 'section_id', 'section_id');
    }

    public function role()
    {
        return $this->belongsTo(Role::class, 'role_id', 'role_id');
    }

    /**
     * Whether this account only registers arrivals (step 1).
     *
     * The RDO counter runs on two accounts: one registers a document as
     * the taxpayer hands it over, the other fills in the referral
     * details afterwards. A counter account is given one of the roles in
     * config('referral.registration_roles') and sees nothing but the
     * registration desk.
     */
    public function registersOnly(): bool
    {
        return in_array(
            $this->role?->role_name,
            config('referral.registration_roles', []),
            true
        );
    }
}
