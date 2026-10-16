<?php

namespace Parse\AdminPanel\Authorization;

use BackedEnum;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Database\Eloquent\Model;
use Parse\AdminPanel\Infrastructure\Laravel\Panel\PanelRuntime;
use Spatie\Permission\Guard;

final class PanelSuperAdmin
{
    public function reserved(PanelRuntime $panel, string $name): bool
    {
        return $panel->superAdminRole !== null && $name === $panel->superAdminRole;
    }

    public function hasRole(Authenticatable $user, PanelRuntime $panel): bool
    {
        if (! $panel->authorizationEnabled || $panel->superAdminRole === null
            || ! $user instanceof $panel->userModel || ! $user instanceof Model
            || ! Guard::getNames($user)->contains($panel->guard)
            || ! app(PanelTeams::class)->containsUser($panel, $user)) {
            return false;
        }

        $teams = app(PanelTeams::class);
        $user->loadMissing('roles');

        return $user->roles->contains(fn (Model $role): bool => $this->reserved($panel, $role->name)
            && $teams->containsRole($panel, $role));
    }

    public function check(Authenticatable $user, PanelRuntime $panel): bool
    {
        $status = data_get($user, 'status');
        $status = $status instanceof BackedEnum ? $status->value : $status;
        if ($panel->activeStatus !== null && (string) $status !== $panel->activeStatus) {
            return false;
        }

        return $this->hasRole($user, $panel);
    }

    public function before(Authenticatable $user, string $ability, array $arguments): ?bool
    {
        $panel = request()->attributes->get('admin_panel');
        if (! $panel instanceof PanelRuntime || $panel->superAdminRole === null) {
            return null;
        }

        // Leave model policies intact; their permission checks enter Gate with the panel guard.
        if ($arguments !== []) {
            if (($arguments[0] ?? null) !== $panel->guard) {
                return null;
            }
        }
        if (! $this->check($user, $panel)) {
            return null;
        }
        if ($arguments === []) {
            $permissionModel = config('permission.models.permission');
            if (! $permissionModel::query()->where('guard_name', $panel->guard)->where('name', $ability)->exists()) {
                return null;
            }
        }

        return true;
    }
}
