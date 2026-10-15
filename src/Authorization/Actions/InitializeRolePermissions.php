<?php

namespace Parse\AdminPanel\Authorization\Actions;

use Spatie\Permission\Contracts\Role;
use Spatie\Permission\PermissionRegistrar;

final class InitializeRolePermissions
{
    public function handle(string $guard, string $name = 'admin'): Role
    {
        $permissionModel = config('permission.models.permission');
        $roleModel = config('permission.models.role');
        $role = (new $roleModel)->getConnection()->transaction(function () use ($guard, $name, $permissionModel, $roleModel): Role {
            $role = $roleModel::findOrCreate($name, $guard);
            $permissions = [];
            foreach (['roles.viewAny', 'roles.view', 'roles.create', 'roles.update', 'roles.delete', 'users.assignRoles'] as $permission) {
                $permissions[] = $permissionModel::findOrCreate($permission, $guard);
            }
            $role->givePermissionTo($permissions);

            return $role;
        });
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        return $role;
    }
}
