<?php

namespace Parse\AdminPanel\Authorization\Actions;

use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Parse\AdminPanel\Authorization\PanelPermissions;
use Parse\AdminPanel\Infrastructure\Laravel\Panel\PanelRuntime;
use Spatie\Permission\Guard;

final class AssignUserRoles
{
    public function handle(PanelRuntime $panel, Authenticatable $actor, Model $user, array $roleIds): void
    {
        abort_unless($panel->authorizationEnabled
            && PanelPermissions::allows($actor, 'users.assignRoles', $panel), 403);
        abort_unless($user instanceof $panel->userModel
            && $user->exists
            && Guard::getNames($user)->contains($panel->guard), 403);

        $roleModel = config('permission.models.role');
        $role = new $roleModel;
        Validator::make(['role_ids' => $roleIds], [
            'role_ids' => ['array'],
            'role_ids.*' => ['required', 'distinct', Rule::exists($roleModel, $role->getKeyName())->where('guard_name', $panel->guard)],
        ])->validate();

        $user->getConnection()->transaction(function () use ($user, $panel, $roleModel, $roleIds): void {
            $roles = $roleModel::query()->where('guard_name', $panel->guard)->whereKey($roleIds)->get();
            $user->unsetRelation('roles');
            $current = $user->roles()->where('guard_name', $panel->guard)->get();
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
        $roleModel = config('permission.models.role');

        return [
            'name' => 'role_ids',
            'label' => __('admin-panel::messages.authorization.roles'),
            'type' => 'checkbox-list',
            'writeOnly' => true,
            'options' => $roleModel::query()->where('guard_name', $panel->guard)->orderBy('name')->get()
                ->map(fn (Model $role): array => ['value' => (string) $role->getKey(), 'label' => $role->name])->all(),
        ];
    }

    public function selected(PanelRuntime $panel, Authenticatable $actor, Model $user): array
    {
        abort_unless($panel->authorizationEnabled
            && PanelPermissions::allows($actor, 'users.assignRoles', $panel)
            && $user instanceof $panel->userModel, 403);

        return $user->roles()->where('guard_name', $panel->guard)->get()->modelKeys();
    }
}
