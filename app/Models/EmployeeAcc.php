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
        'full_name',
        'position',
        'email',
        'password',
        'section_id',
        'role_id',
        'is_active',
        'last_login',
    ];

    /*
    * display_name is deliberately NOT in $appends.
    *
    * An employee model is serialised all over the place - the creator of
    * a document, the author of a comment, the employee on a movement -
    * and those payloads go to other sections. Appending it globally
    * would put every person's name in front of every section, which is
    * the opposite of what the office asked for. Callers that are
    * entitled to a name ask for it: ->append('display_name') for an
    * administrator, or nameVisibleTo($viewer) for a colleague.
    */

    protected $hidden = [
        'password',
        'remember_token',

        /*
        * Hidden for the same reason display_name is not appended: an
        * employee model is serialised as the creator of a document, the
        * author of a comment, the employee on a movement - and those
        * payloads are sent to other sections. The office asked for names
        * to stay inside the section, so the columns do not leave the
        * server unless a caller entitled to them asks:
        *
        *   ->makeVisible(['full_name', 'position', 'email'])
        *
        * which the admin panel does, being entitled to all of them.
        */
        'full_name',
        'position',
        'email',
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
     * How this person is named on screen: "Atty. John Dela Cruz".
     *
     * Falls back to the username, because nine accounts predate the name
     * columns and a blank where a person should be is worse than a
     * username.
     */
    public function getDisplayNameAttribute(): string
    {
        if (blank($this->full_name)) {
            return $this->username;
        }

        return trim(($this->position ? $this->position.' ' : '').$this->full_name);
    }

    /**
     * This person's name, but only to somebody entitled to see it.
     *
     * The office asked for names to stay inside the section: Compliance
     * sees that a document was received by the RDO's Office, while the
     * RDO sees which of its own people received it. Returns null for
     * anyone else, so a caller has to fall back to the section rather
     * than leaking a name by forgetting to check.
     */
    public function nameVisibleTo(?self $viewer): ?string
    {
        if (! $viewer) {
            return null;
        }

        return (int) $viewer->section_id === (int) $this->section_id
            ? $this->display_name
            : null;
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
