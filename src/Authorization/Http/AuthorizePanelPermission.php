<?php

namespace Parse\AdminPanel\Authorization\Http;

use Closure;
use Illuminate\Http\Request;
use Parse\AdminPanel\Authorization\PanelPermissions;
use Parse\AdminPanel\Infrastructure\Laravel\Panel\PanelManager;
use Symfony\Component\HttpFoundation\Response;

final readonly class AuthorizePanelPermission
{
    public function __construct(private PanelManager $panels) {}

    public function handle(Request $request, Closure $next, string $permission): Response
    {
        $panel = $this->panels->current($request);
        abort_unless(PanelPermissions::allows($request->user($panel->guard), $permission, $panel), 403);

        return $next($request);
    }
}
