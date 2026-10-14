<?php

namespace Parse\AdminPanel\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Parse\AdminPanel\Auth\TotpSecret;
use Parse\AdminPanel\Auth\TotpService;
use Parse\AdminPanel\Auth\TwoFactorSession;
use Parse\AdminPanel\Infrastructure\Laravel\Panel\PanelManager;
use Parse\AdminPanel\Infrastructure\Laravel\Panel\PanelRuntime;

final class TwoFactorChallengeController
{
    public function __construct(private readonly PanelManager $panels, private readonly TwoFactorSession $sessions) {}

    public function show(Request $request): Response|RedirectResponse
    {
        $panel = $this->panels->current($request);
        if ($this->pending($request, $panel) === null) {
            return $this->cancel($request);
        }

        return Inertia::render('two-factor-challenge', [
            'challengeAction' => route($panel->route('two-factor.verify')),
            'cancelAction' => route($panel->route('two-factor.cancel')),
        ]);
    }

    public function verify(Request $request, TotpService $totp): RedirectResponse
    {
        $panel = $this->panels->current($request);
        $pending = $this->pending($request, $panel);
        if ($pending === null) {
            return $this->cancel($request);
        }
        $data = $request->validate([
            'code' => ['nullable', 'required_without:recovery_code', 'prohibits:recovery_code', 'string', 'regex:/^[0-9]{6}$/D'],
            'recovery_code' => ['nullable', 'required_without:code', 'prohibits:code', 'string', 'size:20'],
        ]);
        $key = 'admin-panel-2fa:'.hash('sha256', $panel->id.'|'.$pending['user_type'].'|'.$pending['user_id']);
        if (RateLimiter::tooManyAttempts($key, 5)) {
            throw ValidationException::withMessages(['code' => __('auth.throttle', [
                'seconds' => RateLimiter::availableIn($key),
                'minutes' => 1,
            ])]);
        }
        RateLimiter::hit($key, 60);
        $user = Auth::guard($panel->guard)->getProvider()->retrieveById($pending['user_id']);
        $record = $user === null ? null : TotpSecret::forUser($user)->first();
        $status = data_get($user, 'status');
        $status = $status instanceof \BackedEnum ? $status->value : $status;
        if ($user === null || $user::class !== $pending['user_type']
            || ($panel->activeStatus !== null && (string) $status !== $panel->activeStatus)
            || $record === null || (string) $record->getKey() !== $pending['totp_id']) {
            return $this->cancel($request);
        }
        if (! $totp->consume($record, $data['code'] ?? null, $data['recovery_code'] ?? null)) {
            throw ValidationException::withMessages(['code' => __('admin-panel::messages.two_factor.invalid_code')]);
        }

        RateLimiter::clear($key);
        $request->session()->forget($this->sessions->key($panel, 'pending'));
        Auth::guard($panel->guard)->login($user, $pending['remember']);
        $request->session()->regenerate();
        $this->sessions->mark($request, $panel, $user, $record);

        return redirect()->to($pending['intended'] ?? route($panel->route('dashboard')));
    }

    public function cancel(Request $request): RedirectResponse
    {
        $panel = $this->panels->current($request);
        $request->session()->forget($this->sessions->key($panel, 'pending'));

        return to_route($panel->route('login'));
    }

    private function pending(Request $request, PanelRuntime $panel): ?array
    {
        $pending = $request->session()->get($this->sessions->key($panel, 'pending'));
        if (! $panel->twoFactorEnabled || ! is_array($pending)
            || ($pending['guard'] ?? null) !== $panel->guard
            || ($pending['expires_at'] ?? 0) <= now()->timestamp) {
            return null;
        }

        return $pending;
    }
}
