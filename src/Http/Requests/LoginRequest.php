<?php

namespace Parse\AdminPanel\Http\Requests;

use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use LogicException;
use Parse\AdminPanel\Infrastructure\Laravel\Panel\PanelRuntime;

final class LoginRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, list<string>>
     */
    public function rules(): array
    {
        return [
            'email' => ['required', 'string', 'email', 'max:254'],
            'password' => ['required', 'string'],
            'remember' => ['sometimes', 'boolean'],
        ];
    }

    public function authenticate(): Authenticatable
    {
        $this->ensureIsNotRateLimited();

        $credentials = $this->safe()->only(['email', 'password']);
        $activeStatus = $this->panel()->activeStatus;

        if ($activeStatus !== null) {
            $credentials['status'] = $activeStatus;
        }

        $guard = Auth::guard($this->guard());
        $provider = $guard->getProvider();
        $user = $provider->retrieveByCredentials($credentials);

        if ($user === null || ! $provider->validateCredentials($user, $credentials)) {
            RateLimiter::hit($this->throttleKey(), 60);

            throw ValidationException::withMessages([
                'email' => __('auth.failed'),
            ]);
        }

        $provider->rehashPasswordIfRequired($user, $credentials);
        RateLimiter::clear($this->throttleKey());

        return $user;
    }

    private function ensureIsNotRateLimited(): void
    {
        if (! RateLimiter::tooManyAttempts($this->throttleKey(), 5)) {
            return;
        }

        $seconds = RateLimiter::availableIn($this->throttleKey());

        throw ValidationException::withMessages([
            'email' => __('auth.throttle', [
                'seconds' => $seconds,
                'minutes' => (int) ceil($seconds / 60),
            ]),
        ]);
    }

    private function throttleKey(): string
    {
        return Str::transliterate(
            'admin-panel|'.Str::lower($this->string('email')).'|'.$this->ip(),
        );
    }

    private function guard(): string
    {
        return $this->panel()->guard;
    }

    private function panel(): PanelRuntime
    {
        $panel = $this->attributes->get('admin_panel');

        if (! $panel instanceof PanelRuntime) {
            throw new LogicException('The current request has no resolved admin panel.');
        }

        return $panel;
    }
}
