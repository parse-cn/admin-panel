<?php

namespace Parse\AdminPanel\Http\Controllers;

use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Parse\AdminPanel\Auth\TotpSecret;
use Parse\AdminPanel\Auth\TotpService;
use Parse\AdminPanel\Auth\TwoFactorSession;
use Parse\AdminPanel\Infrastructure\Laravel\Panel\PanelManager;

final class TwoFactorController
{
    public function __construct(
        private readonly PanelManager $panels,
        private readonly TotpService $totp,
        private readonly TwoFactorSession $sessions,
    ) {}

    public function start(Request $request): JsonResponse
    {
        $panel = $this->panels->current($request);
        $user = $this->user($request);
        $this->password($request);
        abort_if(TotpSecret::forUser($user)->exists(), 409, __('admin-panel::messages.two_factor.already_enabled'));
        $secret = $this->totp->generateSecret();
        $expires = now()->addMinutes(5)->timestamp;
        $request->session()->put($this->sessions->key($panel, 'binding'), [
            'user_type' => $user::class,
            'user_id' => (string) $user->getAuthIdentifier(),
            'secret' => Crypt::encryptString($secret),
            'expires_at' => $expires,
        ]);

        return $this->json([
            'secret' => $secret,
            'url' => $this->totp->url($secret, (string) data_get($user, 'email', $user->getAuthIdentifier()), $panel->brand['name'] ?? config('app.name', 'Admin')),
            'expiresAt' => $expires,
        ]);
    }

    public function confirm(Request $request): JsonResponse
    {
        $panel = $this->panels->current($request);
        $user = $this->user($request);
        $data = $request->validate(['code' => ['required', 'string', 'regex:/^[0-9]{6}$/D']]);
        $pending = $request->session()->get($this->sessions->key($panel, 'binding'));
        if (! is_array($pending) || ($pending['expires_at'] ?? 0) <= now()->timestamp
            || $pending['user_type'] !== $user::class || $pending['user_id'] !== (string) $user->getAuthIdentifier()) {
            $request->session()->forget($this->sessions->key($panel, 'binding'));
            throw ValidationException::withMessages(['code' => __('admin-panel::messages.two_factor.setup_expired')]);
        }
        abort_if(TotpSecret::forUser($user)->exists(), 409, __('admin-panel::messages.two_factor.already_enabled'));
        $secret = Crypt::decryptString($pending['secret']);
        $step = $this->totp->matchedStep($secret, $data['code']);
        if ($step === false) {
            $this->invalidCode();
        }
        $codes = $this->totp->recoveryCodes();
        try {
            $record = TotpSecret::query()->create([
                'user_type' => $user::class,
                'user_id' => (string) $user->getAuthIdentifier(),
                'secret' => $secret,
                'confirmed_at' => now(),
                'last_used_step' => $step,
                'recovery_codes' => $this->totp->recoveryHashes($codes),
            ]);
        } catch (UniqueConstraintViolationException) {
            abort(409, __('admin-panel::messages.two_factor.already_enabled'));
        }
        $request->session()->forget($this->sessions->key($panel, 'binding'));
        $request->session()->regenerate();
        $this->sessions->mark($request, $panel, $user, $record);

        return $this->json(['recoveryCodes' => $codes]);
    }

    public function cancel(Request $request): JsonResponse
    {
        $panel = $this->panels->current($request);
        $this->user($request);
        $request->session()->forget($this->sessions->key($panel, 'binding'));

        return $this->json([]);
    }

    public function regenerate(Request $request): JsonResponse
    {
        $user = $this->user($request);
        $data = $this->verification($request);
        $codes = $this->totp->recoveryCodes();
        DB::transaction(function () use ($user, $data, $codes): void {
            $record = TotpSecret::forUser($user)->lockForUpdate()->first();
            if ($record === null || ! $this->totp->consume($record, $data['code'] ?? null, $data['recovery_code'] ?? null)) {
                $this->invalidCode();
            }
            $record->update(['recovery_codes' => $this->totp->recoveryHashes($codes)]);
        });

        return $this->json(['recoveryCodes' => $codes]);
    }

    public function destroy(Request $request): JsonResponse
    {
        $panel = $this->panels->current($request);
        abort_if($panel->twoFactorRequired, 403, __('admin-panel::messages.two_factor.cannot_disable'));
        $user = $this->user($request);
        $data = $this->verification($request);
        DB::transaction(function () use ($user, $data): void {
            $record = TotpSecret::forUser($user)->lockForUpdate()->first();
            if ($record === null || ! $this->totp->consume($record, $data['code'] ?? null, $data['recovery_code'] ?? null)) {
                $this->invalidCode();
            }
            $record->delete();
        });
        Auth::guard($panel->guard)->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return $this->json(['redirectUrl' => route($panel->route('login'))]);
    }

    private function user(Request $request): Authenticatable
    {
        $panel = $this->panels->current($request);
        abort_unless($panel->twoFactorEnabled, 404);
        $user = $request->user($panel->guard);
        abort_unless($user !== null, 403);

        return $user;
    }

    private function password(Request $request): void
    {
        $panel = $this->panels->current($request);
        $request->validate(['current_password' => ['required', 'string', "current_password:{$panel->guard}"]]);
    }

    private function verification(Request $request): array
    {
        $this->password($request);

        return $request->validate([
            'code' => ['nullable', 'required_without:recovery_code', 'prohibits:recovery_code', 'string', 'regex:/^[0-9]{6}$/D'],
            'recovery_code' => ['nullable', 'required_without:code', 'prohibits:code', 'string', 'size:20'],
        ]);
    }

    private function invalidCode(): never
    {
        throw ValidationException::withMessages(['code' => __('admin-panel::messages.two_factor.invalid_code')]);
    }

    private function json(array $data): JsonResponse
    {
        return response()->json($data)->header('Cache-Control', 'no-store, private');
    }
}
