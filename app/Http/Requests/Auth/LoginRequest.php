<?php

namespace App\Http\Requests\Auth;

use Illuminate\Auth\Events\Lockout;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class LoginRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'login' => ['required', 'string'],
            'password' => ['required', 'string'],
        ];
    }

    /**
     * Which guard this request actually signed in on.
     *
     * The caller must branch on this rather than asking a guard whether
     * it is signed in: a stale session on the other guard answers yes,
     * and somebody signing in as an administrator would be sent to
     * whichever section was last used at that browser.
     */
    protected ?string $guard = null;

    public function authenticatedGuard(): ?string
    {
        return $this->guard;
    }

    /**
     * Attempt to authenticate the request's credentials.
     *
     * @throws ValidationException
     */
    public function authenticate(): void
    {
        $this->ensureIsNotRateLimited();

        $login = $this->input('login');

        // An email is an administrator; anything else is an employee.
        [$guard, $field] = filter_var($login, FILTER_VALIDATE_EMAIL)
            ? ['web', 'email']
            : ['employee', 'username'];

        $credentials = [
            $field => $login,
            'password' => $this->password,
        ];

        /*
        * is_active is part of the credentials, so a deactivated account
        * cannot sign in at all. Nothing checked it before, which meant
        * deactivating somebody did nothing and the only way to revoke
        * access was to delete the account - taking its audit trail with
        * it.
        */
        if (! Auth::guard($guard)->attempt(
            $credentials + ['is_active' => true],
            $this->boolean('remember')
        )) {

            RateLimiter::hit($this->throttleKey());

            /*
            * Say which of the two it is, but only to somebody who typed
            * the right password - otherwise this would confirm to anyone
            * guessing that an account exists. Being told "wrong
            * password" when the real answer is "your account was
            * switched off" wastes a clerk's morning and then ours.
            */
            throw ValidationException::withMessages([
                'login' => Auth::guard($guard)->validate($credentials)
                    ? 'This account has been deactivated. Please ask your administrator.'
                    : __('auth.failed'),
            ]);
        }

        $this->guard = $guard;

        /*
        * One identity per session. Signing in as an administrator while
        * an employee session was still alive used to leave both - and
        * because the employee guard was consulted first, the
        * administrator was sent to that section's dashboard and stayed
        * signed in as both people at once.
        */
        foreach (['web', 'employee'] as $other) {
            if ($other !== $guard) {
                Auth::guard($other)->logout();
            }
        }

        RateLimiter::clear($this->throttleKey());
    }

    /**
     * Ensure the login request is not rate limited.
     *
     * @throws ValidationException
     */
    public function ensureIsNotRateLimited(): void
    {
        if (! RateLimiter::tooManyAttempts($this->throttleKey(), 5)) {
            return;
        }

        event(new Lockout($this));

        $seconds = RateLimiter::availableIn($this->throttleKey());

        throw ValidationException::withMessages([
            'login' => trans('auth.throttle', [
                'seconds' => $seconds,
                'minutes' => ceil($seconds / 60),
            ]),
        ]);
    }

    /**
     * Get the rate limiting throttle key for the request.
     */
    public function throttleKey(): string
    {
        return Str::transliterate(
            Str::lower($this->input('login')).'|'.$this->ip()
        );
    }
}
