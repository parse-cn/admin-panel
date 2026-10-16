<?php

namespace Parse\AdminPanel\Authorization\Contracts;

use Illuminate\Contracts\Auth\Authenticatable;
use Parse\AdminPanel\Infrastructure\Laravel\Panel\PanelRuntime;

interface ResolvesPermissionTeam
{
    public function resolve(Authenticatable $user, PanelRuntime $panel): int|string|null;
}
