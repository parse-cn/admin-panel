<?php

namespace Parse\AdminPanel\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Parse\AdminPanel\Infrastructure\Laravel\Panel\PanelManager;
use Symfony\Component\HttpFoundation\Response;

final class ResolveAdminPanel
{
    public function __construct(
        private readonly PanelManager $panels,
    ) {}

    public function handle(Request $request, Closure $next, string $panel): Response
    {
        $request->attributes->set('admin_panel', $this->panels->panel($panel));

        return $next($request);
    }
}
