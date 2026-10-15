<?php

namespace Parse\AdminPanel\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use InvalidArgumentException;
use Spatie\Permission\Traits\HasRoles;
use Parse\AdminPanel\Infrastructure\Laravel\Panel\PanelManager;
use Symfony\Component\HttpFoundation\Response;

final class ResolveAdminPanel
{
    public function __construct(
        private readonly PanelManager $panels,
    ) {}

    public function handle(Request $request, Closure $next, string $panel): Response
    {
        $runtime = $this->panels->panel($panel);
        if ($runtime->authorizationEnabled && ! in_array(HasRoles::class, class_uses_recursive($runtime->userModel), true)) {
            throw new InvalidArgumentException('Panel authorization requires the user model to use Spatie HasRoles.');
        }
        $request->attributes->set('admin_panel', $runtime);

        return $next($request);
    }
}
