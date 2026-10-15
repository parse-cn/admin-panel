<?php

namespace Parse\AdminPanel\Authorization\Resources;

use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Arr;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Parse\AdminPanel\Authorization\PanelPermissions;
use Parse\AdminPanel\Infrastructure\Laravel\Panel\PanelManager;
use Parse\AdminPanel\Infrastructure\Laravel\Panel\PanelRuntime;
use Parse\AdminPanel\Resources\AdminPanelResource;

final class RoleResource extends AdminPanelResource
{
    protected static bool $isGloballySearchable = false;

    private static function panel(): PanelRuntime
    {
        return app(PanelManager::class)->current(request());
    }

    public static function model(): string
    {
        return config('permission.models.role');
    }

    public static function routeName(): string
    {
        return static::panel()->route('roles');
    }

    public static function title(): string
    {
        return __('admin-panel::messages.authorization.roles');
    }

    public static function singularLabel(): string
    {
        return __('admin-panel::messages.authorization.role');
    }

    public static function query(): Builder
    {
        return parent::query()->where('guard_name', static::panel()->guard)->withCount('permissions');
    }

    public static function authorize(string $ability, Authenticatable $user, ?Model $record = null): bool
    {
        $panel = static::panel();

        return $panel->authorizationEnabled
            && ($record === null || $record->guard_name === $panel->guard)
            && PanelPermissions::allows($user, 'roles.'.$ability, $panel);
    }

    public static function columns(): array
    {
        return [
            ['name' => 'name', 'label' => __('admin-panel::messages.authorization.name'), 'searchable' => true, 'sortable' => true],
            ['name' => 'permissions_count', 'label' => __('admin-panel::messages.authorization.permission_count')],
        ];
    }

    public static function fields(): array
    {
        $permissionModel = config('permission.models.permission');
        $permissions = $permissionModel::query()->where('guard_name', static::panel()->guard)->orderBy('name')->get();

        return [
            ['name' => 'name', 'label' => __('admin-panel::messages.authorization.name'), 'required' => true],
            [
                'name' => 'permission_ids',
                'label' => __('admin-panel::messages.authorization.permissions'),
                'type' => 'checkbox-list',
                'writeOnly' => true,
                'options' => $permissions->map(fn (Model $permission): array => [
                    'value' => (string) $permission->getKey(),
                    'label' => $permission->name,
                    'group' => str_contains($permission->name, '.')
                        ? Str::beforeLast($permission->name, '.')
                        : (str_contains($permission->name, ':')
                            ? Str::after($permission->name, ':')
                            : __('admin-panel::messages.authorization.other')),
                ])->all(),
            ],
        ];
    }

    public static function rules(?Model $record = null): array
    {
        $role = new (static::model());
        $permission = new (config('permission.models.permission'));

        return [
            'name' => ['required', 'string', 'max:255', Rule::unique(static::model(), 'name')->where('guard_name', static::panel()->guard)->ignore($record?->getKey(), $role->getKeyName())],
            'permission_ids' => ['present', 'array'],
            'permission_ids.*' => ['required', 'distinct', Rule::exists($permission::class, $permission->getKeyName())->where('guard_name', static::panel()->guard)],
        ];
    }

    public static function record(Model $record): array
    {
        $serialized = parent::record($record);
        $serialized['values']['permission_ids'] = $record->permissions()->pluck($record->permissions()->getRelated()->getQualifiedKeyName())->map(strval(...))->all();

        return $serialized;
    }

    public static function createRecord(array $attributes, Authenticatable $user): Model
    {
        $role = new (static::model());
        $role->fill(['name' => $attributes['name'], 'guard_name' => static::panel()->guard]);
        $role->save();
        static::syncPermissions($role, $attributes);

        return $role;
    }

    public static function updateRecord(Model $record, array $attributes): Model
    {
        $record->update(Arr::only($attributes, ['name']));
        static::syncPermissions($record, $attributes);

        return $record;
    }

    private static function syncPermissions(Model $role, array $attributes): void
    {
        $permissionModel = config('permission.models.permission');
        $permissions = $permissionModel::query()
            ->where('guard_name', static::panel()->guard)
            ->whereKey($attributes['permission_ids'])
            ->get();
        $role->syncPermissions($permissions);
    }

    public static function deleteRecord(Model $record, Authenticatable $user): void
    {
        // Include assignments to every model type, not only the current panel user model.
        $assigned = $record->getConnection()->table(config('permission.table_names.model_has_roles'))
            ->where(config('permission.column_names.role_pivot_key') ?: 'role_id', $record->getKey())->exists();

        if ($assigned) {
            throw ValidationException::withMessages(['role' => __('admin-panel::messages.authorization.role_in_use')]);
        }

        $record->delete();
    }

    public static function bulkActions(Authenticatable $user): array
    {
        return [];
    }
}
