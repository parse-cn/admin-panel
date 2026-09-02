<?php

namespace Parse\AdminPanel\Http\Middleware;

use Illuminate\Auth\Middleware\Authenticate;
use Illuminate\Contracts\Auth\Factory as Auth;
use Illuminate\Http\Request;
use Parse\AdminPanel\Infrastructure\Laravel\Panel\PanelManager;

final class AuthenticateAdminPanel extends Authenticate
{
    public function __construct(
        Auth $auth,
        private readonly PanelManager $panels,
    ) {
        parent::__construct($auth);
    }

    protected function redirectTo(Request $request): ?string
    {
        $panel = $this->panels->current($request);

        return $request->expectsJson()
            ? null
            : route($panel->route('login'));
    }
}
