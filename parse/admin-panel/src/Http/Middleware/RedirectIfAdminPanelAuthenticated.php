<?php

namespace Parse\AdminPanel\Http\Middleware;

use Illuminate\Auth\Middleware\RedirectIfAuthenticated;
use Illuminate\Http\Request;
use Parse\AdminPanel\Infrastructure\Laravel\Panel\PanelManager;

final class RedirectIfAdminPanelAuthenticated extends RedirectIfAuthenticated
{
    public function __construct(
        private readonly PanelManager $panels,
    ) {}

    protected function redirectTo(Request $request): string
    {
        return route($this->panels->current($request)->route('dashboard'));
    }
}
