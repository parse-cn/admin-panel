<?php

namespace Parse\AdminPanel\Resources;

use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Arr;
use Parse\AdminPanel\Authorization\Actions\AssignUserRoles;
use Parse\AdminPanel\Authorization\PanelPermissions;
use Parse\AdminPanel\Infrastructure\Laravel\Panel\PanelManager;
use Parse\AdminPanel\Infrastructure\Laravel\Panel\PanelRuntime;

abstract class AdminPanelUserResource extends AdminPanelResource
{
    /**
     * @return list<array<string, mixed>>
     */
    public static function roleFields(): array
    {
        $actor = static::user(request());

        if ($actor === null || ! self::canAssignRoles()) {
            return [];
        }

        return [app(AssignUserRoles::class)->field(self::panel(), $actor)];
    }

    /**
     * @return array<string, mixed>
     */
    public static function rules(?Model $record = null): array
    {
        return [
            ...parent::rules($record),
            'role_ids' => self::canAssignRoles() ? ['sometimes', 'array'] : ['missing'],
        ];
    }

    /**
     * @return array{key: mixed, title: string, values: array<string, mixed>}
     */
    public static function record(Model $record): array
    {
        $data = parent::record($record);
        $actor = static::user(request());

        if ($actor !== null && self::canAssignRoles()) {
            $data['values']['role_ids'] = app(AssignUserRoles::class)
                ->selected(self::panel(), $actor, $record);
        }

        return $data;
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    public static function createRecord(array $attributes, Authenticatable $user): Model
    {
        $record = parent::createRecord(Arr::except($attributes, ['role_ids']), $user);
        self::assignRoles($record, $attributes, $user);

        return $record;
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    public static function updateRecord(Model $record, array $attributes): Model
    {
        $record = parent::updateRecord($record, Arr::except($attributes, ['role_ids']));
        self::assignRoles($record, $attributes, static::user(request()));

        return $record;
    }

    private static function panel(): PanelRuntime
    {
        return app(PanelManager::class)->current(request());
    }

    private static function canAssignRoles(): bool
    {
        $panel = self::panel();

        return $panel->authorizationEnabled
            && PanelPermissions::allows(static::user(request()), 'users.assignRoles', $panel);
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    private static function assignRoles(Model $record, array $attributes, ?Authenticatable $actor): void
    {
        if (! array_key_exists('role_ids', $attributes)) {
            return;
        }

        abort_if($actor === null, 403);

        app(AssignUserRoles::class)->handle(self::panel(), $actor, $record, $attributes['role_ids']);
    }
}
