<?php

namespace Parse\AdminPanel\Authorization;

use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Support\Facades\Gate;
use Parse\AdminPanel\Infrastructure\Laravel\Panel\PanelRuntime;

final class PanelPermissions
{
    public static function allows(?Authenticatable $user, string $permission, PanelRuntime $panel): bool
    {
        return $user !== null && app(PanelTeams::class)->containsUser($panel, $user) && Gate::forUser($user)->allows($permission, [$panel->guard]);
    }
}
