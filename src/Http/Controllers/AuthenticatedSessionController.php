<?php

namespace Parse\AdminPanel\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;
use Parse\AdminPanel\Http\Requests\LoginRequest;
use Parse\AdminPanel\Auth\TotpSecret;
use Parse\AdminPanel\Auth\TwoFactorSession;
use Parse\AdminPanel\Infrastructure\Laravel\Panel\PanelManager;

final class AuthenticatedSessionController extends Controller
{
    public function __construct(
        private readonly PanelManager $panels,
    ) {}

    public function create(Request $request): Response
    {
        $panel = $this->panels->current($request);

        return Inertia::render($panel->loginComponent, [
            'loginAction' => route($panel->route('login.store')),
        ]);
    }

    public function store(LoginRequest $request, TwoFactorSession $twoFactor): RedirectResponse
    {
        $user = $request->authenticate();
        $panel = $this->panels->current($request);
        $request->session()->forget($twoFactor->key($panel, 'verified'));
        $request->session()->forget($twoFactor->key($panel, 'pending'));

        if ($panel->twoFactorEnabled && ($record = TotpSecret::forUser($user)->first()) !== null) {
            $twoFactor->begin($request, $panel, $user, $record, $request->boolean('remember'));

            return to_route($panel->route('two-factor.challenge'));
        }

        Auth::guard($panel->guard)->login($user, $request->boolean('remember'));
        $request->session()->regenerate();

        return redirect()->intended(route($panel->route('dashboard')));
    }

    public function destroy(Request $request): RedirectResponse
    {
        $panel = $this->panels->current($request);

        Auth::guard($panel->guard)->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return to_route($panel->route('login'));
    }
}
