<?php

namespace Parse\AdminPanel\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;
use Parse\AdminPanel\Http\Requests\LoginRequest;
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

    public function store(LoginRequest $request): RedirectResponse
    {
        $request->authenticate();
        $request->session()->regenerate();

        $panel = $this->panels->current($request);

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
