<?php

namespace Parse\AdminPanel\Resources;

use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Parse\AdminPanel\Crud\Infrastructure\Laravel\Resources\EloquentCrudResource;
use Parse\AdminPanel\Infrastructure\Laravel\Panel\PanelRuntime;
use Parse\AdminPanel\Resources\Details\Detail;

abstract class AdminPanelResource extends EloquentCrudResource
{
    protected static bool $isGloballySearchable = true;

    protected static int $globalSearchSort = 0;

    public static function detail(): Detail
    {
        return Detail::make();
    }

    public static function showComponent(): string
    {
        return 'crud/show-content';
    }

    public static function showPageComponent(): string
    {
        return 'crud/show';
    }

    public static function showWithinIndex(Request $request, Model $record): bool
    {
        return ! static::detail()->isPage($request, $record);
    }

    public static function createSheetComponent(): string
    {
        return 'crud/form-content';
    }

    public static function createWithinIndex(Request $request): bool
    {
        $model = static::model();

        return ! static::detail()->isPage($request, new $model);
    }

    public static function editSheetComponent(): string
    {
        return 'crud/form-content';
    }

    public static function editWithinIndex(Request $request, Model $record): bool
    {
        return ! static::detail()->isPage($request, $record);
    }

    public static function definition(): array
    {
        $definition = parent::definition();
        $panel = request()->attributes->get('admin_panel');

        if (! $panel instanceof PanelRuntime) {
            return $definition;
        }

        $uploadUrl = route($panel->route('uploads.store'), [
            'purpose' => 'image',
        ]);
        $definition['fields'] = array_map(
            fn (array $item): array => array_key_exists('fields', $item)
                ? [
                    ...$item,
                    'fields' => array_map(
                        fn (array $field): array => self::withDefaultImageUpload($field, $uploadUrl),
                        $item['fields'],
                    ),
                ]
                : self::withDefaultImageUpload($item, $uploadUrl),
            $definition['fields'],
        );

        return $definition;
    }

    public static function perPage(): int
    {
        $panel = request()->attributes->get('admin_panel');

        return $panel instanceof PanelRuntime ? $panel->perPage : parent::perPage();
    }

    public static function perPageOptions(): array
    {
        $panel = request()->attributes->get('admin_panel');

        return $panel instanceof PanelRuntime
            ? $panel->perPageOptions
            : parent::perPageOptions();
    }

    public static function user(Request $request): ?Authenticatable
    {
        $panel = $request->attributes->get('admin_panel');

        return $panel instanceof PanelRuntime
            ? $request->user($panel->guard)
            : null;
    }

    public static function isGloballySearchable(): bool
    {
        return static::$isGloballySearchable && static::globallySearchableAttributes() !== [];
    }

    public static function globalSearchSort(): int
    {
        return static::$globalSearchSort;
    }

    /**
     * @return list<string>
     */
    public static function globallySearchableAttributes(): array
    {
        return collect([static::recordTitleAttribute(), ...static::searchableColumns()])
            ->filter(fn (mixed $attribute): bool => is_string($attribute))
            ->unique()
            ->values()
            ->all();
    }

    public static function globalSearchQuery(): Builder
    {
        return static::query();
    }

    /**
     * @return list<string>
     */
    public static function globalSearchEagerLoads(): array
    {
        return [];
    }

    public static function globalSearchResultTitle(Model $record): string
    {
        return static::recordTitle($record);
    }

    /**
     * @return array<string, string|null>
     */
    public static function globalSearchResultDetails(Model $record): array
    {
        return [];
    }

    public static function globalSearchResultUrl(Model $record): ?string
    {
        $routeName = static::routeName();
        $key = $record->getAttribute(static::routeKeyName());

        if (Route::has($routeName.'.show')) {
            return route($routeName.'.show', $key);
        }

        if (Route::has($routeName.'.edit')) {
            return route($routeName.'.edit', $key);
        }

        return null;
    }

    public static function globalSearchResultIcon(Model $record): ?string
    {
        return static::globalSearchResourceIcon();
    }

    public static function globalSearchResourceIcon(): ?string
    {
        $navigation = static::navigation();

        return is_string($navigation['icon'] ?? null) ? $navigation['icon'] : null;
    }

    public static function globalSearchResultImage(Model $record): ?string
    {
        return null;
    }

    /**
     * @param  array<string, mixed>  $field
     * @return array<string, mixed>
     */
    private static function withDefaultImageUpload(array $field, string $uploadUrl): array
    {
        if (($field['type'] ?? null) !== 'image' || isset($field['uploadUrl'])) {
            return $field;
        }

        return [
            ...$field,
            'uploadUrl' => $uploadUrl,
        ];
    }
}
