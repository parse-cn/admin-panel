<?php

namespace Parse\AdminPanel\Http\Middleware;

use Closure;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use InvalidArgumentException;
use Parse\AdminPanel\Authorization\PanelTeams;
use Parse\AdminPanel\Infrastructure\Laravel\Panel\PanelManager;
use Symfony\Component\HttpFoundation\Response;

final readonly class SetPanelPermissionTeam
{
    public function __construct(private PanelManager $panels, private PanelTeams $teams) {}

    public function handle(Request $request, Closure $next): Response
    {
        if (! $this->teams->enabled()) {
            return $next($request);
        }

        $panel = $this->panels->current($request);
        $user = $request->user($panel->guard);
        try {
            $teamId = $user === null || ! $panel->authorizationEnabled ? null : $this->teams->resolve($panel, $user);
        } catch (InvalidArgumentException) {
            abort(403);
        }

        $clearRelations = static function () use ($user): void {
            if ($user instanceof Model) {
                $user->unsetRelation('roles')->unsetRelation('permissions');
            }
        };
        $clearRelations();
        try {
            return $this->teams->run($teamId, fn (): Response => $next($request));
        } finally {
            $clearRelations();
        }
    }
}
