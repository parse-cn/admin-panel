<?php

namespace Parse\AdminPanel\Auth;

use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Http\Request;
use Parse\AdminPanel\Infrastructure\Laravel\Panel\PanelRuntime;

final class TwoFactorSession
{
    public function key(PanelRuntime $panel, string $suffix): string
    {
        return 'admin_panel_2fa_'.hash('sha256', $panel->id).'_'.$suffix;
    }

    public function begin(Request $request, PanelRuntime $panel, Authenticatable $user, TotpSecret $record, bool $remember = false): void
    {
        $request->session()->regenerate();
        $request->session()->forget($this->key($panel, 'verified'));
        $request->session()->put($this->key($panel, 'pending'), [
            'user_id' => (string) $user->getAuthIdentifier(),
            'user_type' => $user::class,
            'guard' => $panel->guard,
            'totp_id' => (string) $record->getKey(),
            'remember' => $remember,
            'intended' => $request->session()->pull('url.intended'),
            'expires_at' => now()->addMinutes(5)->timestamp,
        ]);
    }

    public function mark(Request $request, PanelRuntime $panel, Authenticatable $user, TotpSecret $record): void
    {
        $request->session()->put($this->key($panel, 'verified'), $this->marker($user, $record));
    }

    public function verified(Request $request, PanelRuntime $panel, Authenticatable $user, TotpSecret $record): bool
    {
        return $request->session()->get($this->key($panel, 'verified')) === $this->marker($user, $record);
    }

    private function marker(Authenticatable $user, TotpSecret $record): array
    {
        return [$user::class, (string) $user->getAuthIdentifier(), (string) $record->getKey(), $record->getRawOriginal('confirmed_at')];
    }
}
