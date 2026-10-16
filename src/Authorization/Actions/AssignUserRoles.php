<?php

namespace Parse\AdminPanel\Authorization\Actions;

use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Parse\AdminPanel\Authorization\PanelPermissions;
use Parse\AdminPanel\Authorization\PanelSuperAdmin;
use Parse\AdminPanel\Authorization\PanelTeams;
use Parse\AdminPanel\Infrastructure\Laravel\Panel\PanelRuntime;
use Spatie\Permission\Guard;

final class AssignUserRoles
{
    public function handle(PanelRuntime $panel, Authenticatable $actor, Model $user, array $roleIds): void
    {
        abort_unless($panel->authorizationEnabled
            && PanelPermissions::allows($actor, 'users.assignRoles', $panel), 403);
        abort_unless($user instanceof $panel->userModel
            && app(PanelTeams::class)->containsUser($panel, $user)
            && $user->exists
            && Guard::getNames($user)->contains($panel->guard), 403);

        $roleModel = config('permission.models.role');
        $role = new $roleModel;
        $teams = app(PanelTeams::class);
        $exists = Rule::exists($roleModel, $role->getKeyName())->where('guard_name', $panel->guard);
        if ($panel->superAdminRole !== null) {
            $exists->whereNot('name', $panel->superAdminRole);
        }
        abort_if(app(PanelSuperAdmin::class)->hasRole($user, $panel) && ! app(PanelSuperAdmin::class)->check($actor, $panel), 403);
        if ($teams->enabled()) {
            $exists->where($teams->key(), $teams->current());
        }
        Validator::make(['role_ids' => $roleIds], [
            'role_ids' => ['array'],
            'role_ids.*' => ['required', 'distinct', $exists],
        ])->validate();

        $user->getConnection()->transaction(function () use ($user, $panel, $roleIds): void {
            $roles = app(PanelTeams::class)->roles($panel)->whereKey($roleIds)->get();
            $user->unsetRelation('roles');
            $current = $user->roles()->where('guard_name', $panel->guard)
                ->when($panel->superAdminRole !== null, fn ($query) => $query->where('name', '!=', $panel->superAdminRole))->get();
            if ($current->isNotEmpty()) {
                $user->removeRole($current);
            }
            if ($roles->isNotEmpty()) {
                $user->assignRole($roles);
            }
            $user->unsetRelation('roles')->unsetRelation('permissions');
        });
        // The actor may be another instance of the same user in this request.
        if ($actor instanceof Model && $actor::class === $user::class && $actor->getKey() === $user->getKey()) {
            $actor->unsetRelation('roles')->unsetRelation('permissions');
        }
    }

    public function field(PanelRuntime $panel, Authenticatable $actor): array
    {
        abort_unless($panel->authorizationEnabled
            && PanelPermissions::allows($actor, 'users.assignRoles', $panel), 403);

        return [
            'name' => 'role_ids',
            'label' => __('admin-panel::messages.authorization.roles'),
            'type' => 'checkbox-list',
            'writeOnly' => true,
            'options' => app(PanelTeams::class)->roles($panel)
                ->when($panel->superAdminRole !== null, fn ($query) => $query->where('name', '!=', $panel->superAdminRole))
                ->orderBy('name')->get()
                ->map(fn (Model $role): array => ['value' => (string) $role->getKey(), 'label' => $role->name])->all(),
        ];
    }

    public function selected(PanelRuntime $panel, Authenticatable $actor, Model $user): array
    {
        abort_unless($panel->authorizationEnabled
            && PanelPermissions::allows($actor, 'users.assignRoles', $panel)
            && $user instanceof $panel->userModel
            && app(PanelTeams::class)->containsUser($panel, $user), 403);

        return $user->roles()->where('guard_name', $panel->guard)
            ->when($panel->superAdminRole !== null, fn ($query) => $query->where('name', '!=', $panel->superAdminRole))
            ->when(app(PanelTeams::class)->enabled(), fn ($query) => $query->where(config('permission.table_names.roles').'.'.app(PanelTeams::class)->key(), app(PanelTeams::class)->current()))
            ->get()->modelKeys();
    }
}
