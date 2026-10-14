<?php

namespace Parse\AdminPanel\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Parse\AdminPanel\Auth\TotpSecret;
use Parse\AdminPanel\Auth\TwoFactorSession;
use Parse\AdminPanel\Infrastructure\Laravel\Panel\PanelManager;
use Symfony\Component\HttpFoundation\Response;

final class EnsurePanelTwoFactor
{
    public function __construct(private readonly PanelManager $panels, private readonly TwoFactorSession $sessions) {}

    public function handle(Request $request, Closure $next): Response
    {
        $panel = $this->panels->current($request);
        if (! $panel->twoFactorEnabled) {
            return $next($request);
        }

        $user = $request->user($panel->guard);
        $record = TotpSecret::forUser($user)->first();
        if ($record === null && $panel->twoFactorRequired) {
            if ($request->routeIs(
                $panel->route('profile.security'),
                $panel->route('profile.two-factor.start'),
                $panel->route('profile.two-factor.confirm'),
                $panel->route('profile.two-factor.cancel'),
                $panel->route('logout'),
            )) {
                return $next($request);
            }

            $setupUrl = route($panel->route('profile.security'));
            if ($request->expectsJson() && ! $request->header('X-Inertia')) {
                return response()->json([
                    'message' => __('admin-panel::messages.two_factor.setup_required'),
                    'setupUrl' => $setupUrl,
                ], 403);
            }

            return redirect()->to($setupUrl);
        }

        if ($record === null || $this->sessions->verified($request, $panel, $user, $record)) {
            return $next($request);
        }

        if ($request->isMethod('GET') && ! $request->expectsJson()) {
            $request->session()->put('url.intended', $request->fullUrl());
        }
        $this->sessions->begin($request, $panel, $user, $record);
        Auth::guard($panel->guard)->logout();

        if ($request->expectsJson() && ! $request->header('X-Inertia')) {
            return response()->json([
                'message' => __('admin-panel::messages.two_factor.required'),
                'challengeUrl' => route($panel->route('two-factor.challenge')),
            ], 403);
        }

        return to_route($panel->route('two-factor.challenge'));
    }
}
