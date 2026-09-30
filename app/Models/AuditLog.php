<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Request;
use RuntimeException;

/**
 * One line of the audit log.
 *
 * Append-only by construction: updating or deleting a row throws. A log
 * that can be edited answers nothing, and the whole reason this table
 * exists is to be the thing nobody can quietly correct afterwards.
 *
 * Writes must never break the action they are recording. record() is
 * wrapped so that a failure to log a password reset does not also fail
 * the password reset - it reports instead, and the failure surfaces in
 * the application log.
 */
class AuditLog extends Model
{
    protected $primaryKey = 'audit_log_id';

    public $timestamps = false;

    protected $fillable = [
        'action',
        'actor_type',
        'actor_id',
        'actor_label',
        'subject_type',
        'subject_id',
        'subject_label',
        'context',
        'ip',
        'user_agent',
        'created_at',
    ];

    protected function casts(): array
    {
        return [
            'context' => 'array',
            'created_at' => 'datetime',
        ];
    }

    protected static function booted(): void
    {
        static::updating(function () {
            throw new RuntimeException('Audit entries cannot be changed.');
        });

        static::deleting(function () {
            throw new RuntimeException('Audit entries cannot be deleted.');
        });
    }

    /**
     * Record something.
     *
     * $subject is the account, section or role that was acted on; the
     * actor is whoever is signed in, worked out here so no caller has to
     * remember which guard they are on.
     */
    public static function record(
        string $action,
        ?Model $subject = null,
        array $context = [],
        ?Model $actor = null
    ): void {
        try {
            $actor ??= Auth::guard('web')->user() ?? Auth::guard('employee')->user();

            static::create([
                'action' => $action,

                'actor_type' => static::typeOf($actor),
                'actor_id' => $actor?->getKey(),
                'actor_label' => static::labelFor($actor),

                'subject_type' => static::typeOf($subject),
                'subject_id' => $subject?->getKey(),
                'subject_label' => static::labelFor($subject),

                'context' => $context ?: null,

                'ip' => Request::ip(),

                // Truncated: some browsers send far more than the column.
                'user_agent' => substr((string) Request::userAgent(), 0, 255) ?: null,

                'created_at' => now(),
            ]);
        } catch (\Throwable $e) {
            /*
            * Never let the log break the thing it is logging. A missing
            * entry is bad; a password reset that fails because the log
            * was unreachable is worse.
            */
            report($e);
        }
    }

    /**
     * Record something nobody was signed in for - a failed login.
     */
    public static function recordAnonymous(string $action, array $context = []): void
    {
        static::record($action, null, $context, null);
    }

    protected static function typeOf(?Model $model): ?string
    {
        return match (true) {
            $model instanceof User => 'admin',
            $model instanceof EmployeeAcc => 'employee',
            $model instanceof Section => 'section',
            $model instanceof Role => 'role',
            $model === null => null,
            default => class_basename($model),
        };
    }

    /**
     * How this account or record is named in the log.
     *
     * Written down at the time rather than looked up later, so an entry
     * still says who did it after the account has been renamed or
     * deleted.
     */
    protected static function labelFor(?Model $model): ?string
    {
        return match (true) {
            $model instanceof User => $model->name.' ('.$model->email.')',
            $model instanceof EmployeeAcc => $model->display_name.' ('.$model->username.')',
            $model instanceof Section => $model->section_name,
            $model instanceof Role => $model->role_name,
            default => null,
        };
    }
}
