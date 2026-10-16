<?php

namespace Parse\AdminPanel\Authorization;

use Closure;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use InvalidArgumentException;
use Parse\AdminPanel\Infrastructure\Laravel\Panel\PanelRuntime;
use Spatie\Permission\PermissionRegistrar;

final class PanelTeams
{
    public function enabled(): bool
    {
        return (bool) config('permission.teams', false);
    }

    public function key(): string
    {
        return config('permission.column_names.team_foreign_key', 'team_id');
    }

    public function current(): int|string
    {
        $id = app(PermissionRegistrar::class)->getPermissionsTeamId();
        if ($id === null || $id === '') {
            throw new InvalidArgumentException('A permission team must be resolved before accessing panel roles.');
        }

        return $id;
    }

    public function resolve(PanelRuntime $panel, ?Authenticatable $user = null, int|string|null $explicit = null): int|string|null
    {
        if (! $this->enabled()) {
            if ($explicit !== null) {
                throw new InvalidArgumentException('--team-id requires Spatie teams to be enabled.');
            }

            return null;
        }

        $resolved = $panel->permissionTeamId;
        if ($panel->permissionTeamResolver !== null && $user !== null) {
            $resolved = app($panel->permissionTeamResolver)->resolve($user, $panel);
            if ($resolved === null || $resolved === '') {
                throw new InvalidArgumentException('The user does not belong to a permission team for this panel.');
            }
        }
        if ($explicit !== null && $resolved !== null && (string) $explicit !== (string) $resolved) {
            throw new InvalidArgumentException('The supplied team does not match the user or panel permission team.');
        }
        $id = $resolved ?? $explicit;
        if ($id === null || $id === '') {
            throw new InvalidArgumentException('A permission team is required; supply --team-id for tenant role commands.');
        }

        return $id;
    }

    public function containsUser(PanelRuntime $panel, Authenticatable $user): bool
    {
        if (! $this->enabled()) {
            return true;
        }

        try {
            return (string) $this->resolve($panel, $user) === (string) $this->current();
        } catch (InvalidArgumentException) {
            return false;
        }
    }

    public function roles(PanelRuntime $panel): Builder
    {
        $model = config('permission.models.role');
        $query = $model::query()->where('guard_name', $panel->guard);

        return $this->enabled() ? $query->where($this->key(), $this->current()) : $query;
    }

    public function containsRole(PanelRuntime $panel, Model $role): bool
    {
        return $role->guard_name === $panel->guard
            && (! $this->enabled() || (string) $role->getAttribute($this->key()) === (string) $this->current());
    }

    public function run(int|string|null $teamId, Closure $callback): mixed
    {
        if (! $this->enabled()) {
            return $callback();
        }

        $registrar = app(PermissionRegistrar::class);
        $previous = $registrar->getPermissionsTeamId();
        $registrar->setPermissionsTeamId($teamId);
        try {
            return $callback();
        } finally {
            $registrar->setPermissionsTeamId($previous);
        }
    }
}
