<?php

namespace Parse\AdminPanel\Authorization\Resources;

use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Lang;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Parse\AdminPanel\Authorization\PanelPermissions;
use Parse\AdminPanel\Authorization\PanelSuperAdmin;
use Parse\AdminPanel\Authorization\PanelTeams;
use Parse\AdminPanel\Infrastructure\Laravel\Panel\PanelManager;
use Parse\AdminPanel\Infrastructure\Laravel\Panel\PanelRuntime;
use Parse\AdminPanel\Resources\AdminPanelResource;

final class RoleResource extends AdminPanelResource
{
    protected static bool $isGloballySearchable = false;

    protected static ?string $recordTitleAttribute = 'name';

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
        return self::panel()->route('roles');
    }

    public static function title(): string
    {
        return __('admin-panel::messages.authorization.roles');
    }

    public static function singularLabel(): string
    {
        return __('admin-panel::messages.authorization.role');
    }

    public static function showComponent(): string
    {
        return 'authorization/roles/show-content';
    }

    public static function query(): Builder
    {
        return app(PanelTeams::class)->roles(self::panel())->withCount('permissions');
    }

    public static function authorize(string $ability, Authenticatable $user, ?Model $record = null): bool
    {
        $panel = self::panel();

        return $panel->authorizationEnabled
            && ($record === null || app(PanelTeams::class)->containsRole($panel, $record))
            && ($record === null || ! in_array($ability, ['update', 'delete'], true) || ! app(PanelSuperAdmin::class)->reserved($panel, $record->name))
            && PanelPermissions::allows($user, 'roles.'.$ability, $panel);
    }

    public static function columns(): array
    {
        return [
            ['name' => 'name', 'label' => __('admin-panel::messages.authorization.name'), 'type' => 'identity', 'subtitle' => 'role_description', 'link' => 'show', 'searchable' => true, 'sortable' => true],
            ['name' => 'permissions_count', 'label' => __('admin-panel::messages.authorization.permission_count'), 'sortable' => true],
            ['name' => 'guard_name', 'label' => __('admin-panel::messages.authorization.guard'), 'type' => 'badge'],
            ['name' => 'created_at', 'label' => __('admin-panel::messages.authorization.created_at'), 'type' => 'datetime', 'sortable' => true],
            ['name' => 'updated_at', 'label' => __('admin-panel::messages.authorization.updated_at'), 'type' => 'datetime', 'sortable' => true],
        ];
    }

    public static function fields(): array
    {
        $permissionModel = config('permission.models.permission');
        $permissions = $permissionModel::query()->where('guard_name', self::panel()->guard)->orderBy('name')->get();

        return [
            ['name' => 'name', 'label' => __('admin-panel::messages.authorization.name'), 'required' => true],
            [
                'name' => 'permission_ids',
                'label' => __('admin-panel::messages.authorization.permissions'),
                'type' => 'checkbox-list',
                'writeOnly' => true,
                'options' => $permissions->map(fn (Model $permission): array => [
                    'value' => (string) $permission->getKey(),
                    'permission' => $permission->name,
                    'label' => self::permissionLabel($permission->name),
                    'group' => self::permissionGroupLabel(self::permissionGroup($permission->name)),
                ])->all(),
            ],
        ];
    }

    private static function permissionGroup(string $permission): string
    {
        return str_contains($permission, '.') ? Str::beforeLast($permission, '.') : 'other';
    }

    private static function permissionLabel(string $permission): string
    {
        $key = 'admin-panel::messages.authorization.permission_labels.'.$permission;
        if (Lang::has($key)) {
            return __($key);
        }
        $action = str_contains($permission, '.') ? Str::afterLast($permission, '.') : $permission;
        $key = 'admin-panel::messages.authorization.actions.'.$action;

        return Lang::has($key) ? __($key) : $permission;
    }

    private static function permissionGroupLabel(string $group): string
    {
        foreach ([...self::panel()->resources(), ...self::panel()->widgets()] as $registration) {
            if ($registration->resource::permissionPrefix() === $group) {
                return $registration->resource::title();
            }
        }
        $key = 'admin-panel::messages.authorization.permission_groups.'.$group;

        return Lang::has($key) ? __($key) : $group;
    }

    public static function rules(?Model $record = null): array
    {
        $role = new (self::model());
        $permission = new (config('permission.models.permission'));
        $teams = app(PanelTeams::class);
        $unique = Rule::unique(self::model(), 'name')->where('guard_name', self::panel()->guard);
        if ($teams->enabled()) {
            $unique->where($teams->key(), $teams->current());
        }

        return [
            'name' => ['required', 'string', 'max:255', Rule::notIn(array_filter([self::panel()->superAdminRole], fn ($name) => $name !== null)), $unique->ignore($record?->getKey(), $role->getKeyName())],
            'permission_ids' => ['present', 'array'],
            'permission_ids.*' => ['required', 'distinct', Rule::exists($permission::class, $permission->getKeyName())->where('guard_name', self::panel()->guard)],
        ];
    }

    public static function record(Model $record): array
    {
        $serialized = parent::record($record);
        $isSuperAdmin = app(PanelSuperAdmin::class)->reserved(self::panel(), $record->name);
        $serialized['values']['is_super_admin'] = $isSuperAdmin;
        if ($isSuperAdmin) {
            $serialized['values']['role_description'] = __('admin-panel::messages.authorization.system_role');

            return $serialized;
        }
        $permissions = $record->permissions()->orderBy('name')->get();
        $serialized['values']['permission_options'] = self::fields()[1]['options'];
        $serialized['values']['permission_ids'] = $permissions->modelKeys();
        $serialized['values']['permission_ids'] = array_map(strval(...), $serialized['values']['permission_ids']);
        $serialized['values']['permission_groups'] = $permissions
            ->groupBy(fn (Model $permission): string => str_contains($permission->getAttribute('name'), '.')
                ? Str::beforeLast($permission->getAttribute('name'), '.')
                : __('admin-panel::messages.authorization.other'))
            ->map(fn ($items, string $group): array => [
                'name' => $group,
                'label' => self::permissionGroupLabel($group),
                'permissions' => $items->pluck('name')->values()->all(),
            ])->values()->all();

        $serialized['values']['permission_labels'] = $permissions->mapWithKeys(fn (Model $permission): array => [
            $permission->getAttribute('name') => self::permissionLabel($permission->getAttribute('name')),
        ])->all();

        return $serialized;
    }

    public static function recordForIndex(Model $record): array
    {
        // Keep the grouped permission payload on detail/edit responses only.
        $serialized = parent::record($record);
        if (app(PanelSuperAdmin::class)->reserved(self::panel(), $record->name)) {
            $serialized['values']['permissions_count'] = __('admin-panel::messages.authorization.all_permissions');
            $serialized['values']['role_description'] = __('admin-panel::messages.authorization.system_role');
        }

        return $serialized;
    }

    public static function createRecord(array $attributes, Authenticatable $user): Model
    {
        abort_if(app(PanelSuperAdmin::class)->reserved(self::panel(), $attributes['name']), 403);
        $role = new (self::model());
        $role->fill(['name' => $attributes['name'], 'guard_name' => self::panel()->guard]);
        $teams = app(PanelTeams::class);
        if ($teams->enabled()) {
            $role->setAttribute($teams->key(), $teams->current());
        }
        $role->save();
        self::syncPermissions($role, $attributes);

        return $role;
    }

    public static function updateRecord(Model $record, array $attributes): Model
    {
        abort_unless(app(PanelTeams::class)->containsRole(self::panel(), $record), 403);
        abort_if(app(PanelSuperAdmin::class)->reserved(self::panel(), $record->name)
            || app(PanelSuperAdmin::class)->reserved(self::panel(), $attributes['name'] ?? $record->name), 403);
        $record->update(Arr::only($attributes, ['name']));
        self::syncPermissions($record, $attributes);

        return $record;
    }

    private static function syncPermissions(Model $role, array $attributes): void
    {
        $permissionModel = config('permission.models.permission');
        $permissions = $permissionModel::query()
            ->where('guard_name', self::panel()->guard)
            ->whereKey($attributes['permission_ids'])
            ->get();
        $role->syncPermissions($permissions);
    }

    public static function deleteRecord(Model $record, Authenticatable $user): void
    {
        abort_unless(app(PanelTeams::class)->containsRole(self::panel(), $record), 403);
        abort_if(app(PanelSuperAdmin::class)->reserved(self::panel(), $record->name), 403);
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
