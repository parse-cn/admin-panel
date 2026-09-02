<?php

namespace Parse\AdminPanel\Crud\Infrastructure\Laravel\Resources;

use BackedEnum;
use Closure;
use DateTimeInterface;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Parse\AdminPanel\Crud\Crud\CrudResource;

abstract class EloquentCrudResource extends CrudResource
{
    protected static ?string $recordTitleAttribute = null;

    public static function user(Request $request): ?Authenticatable
    {
        return $request->user();
    }

    /**
     * @return class-string<Model>
     */
    abstract public static function model(): string;

    abstract public static function routeName(): string;

    abstract public static function title(): string;

    abstract public static function singularLabel(): string;

    public static function description(): ?string
    {
        return null;
    }

    public static function showRowActions(): bool
    {
        return true;
    }

    /**
     * @return list<array<string, mixed>>
     */
    abstract public static function columns(): array;

    /**
     * @return list<array<string, mixed>>
     */
    abstract public static function fields(): array;

    public static function query(): Builder
    {
        $model = static::model();

        return $model::query();
    }

    /**
     * Build the scoped query used by an embedded CRUD widget.
     *
     * Context is untrusted input. Resources that use it must resolve and
     * authorize any related models before applying constraints.
     *
     * @param  array<string, mixed>  $context
     */
    public static function queryForWidget(Request $request, array $context = []): Builder
    {
        return static::query();
    }

    /**
     * @return array<string, mixed>
     */
    public static function widgetConfig(): array
    {
        return [
            'showSearch' => true,
            'showFilters' => true,
            'showPagination' => true,
            'showCreate' => static::canCreate(),
            'showBulkActions' => true,
            'createMode' => 'modal',
            'editMode' => 'modal',
            'showMode' => 'drawer',
        ];
    }

    public static function routeKeyName(): string
    {
        return (new (static::model()))->getRouteKeyName();
    }

    public static function recordTitleAttribute(): ?string
    {
        return static::$recordTitleAttribute;
    }

    public static function recordTitle(Model $record): string
    {
        $attribute = static::recordTitleAttribute();
        $title = $attribute === null
            ? data_get($record, 'name')
            : data_get($record, $attribute);

        if (is_scalar($title) && (string) $title !== '') {
            return (string) $title;
        }

        $key = $record->getAttribute(static::routeKeyName());

        return is_scalar($key) && (string) $key !== ''
            ? (string) $key
            : static::singularLabel();
    }

    public static function resolveRecord(string $key): Model
    {
        return static::query()->where(static::routeKeyName(), $key)->firstOrFail();
    }

    public static function authorize(string $ability, Authenticatable $user, ?Model $record = null): bool
    {
        return true;
    }

    public static function canCreate(): bool
    {
        return true;
    }

    public static function canUpdate(): bool
    {
        return true;
    }

    public static function canDelete(): bool
    {
        return true;
    }

    public static function perPage(): int
    {
        return 10;
    }

    /**
     * @return list<int>
     */
    public static function perPageOptions(): array
    {
        return [5, 10, 15, 25, 50];
    }

    /**
     * @return list<int>
     */
    public static function resolvedPerPageOptions(): array
    {
        $defaultPerPage = max(1, static::perPage());
        $options = collect(static::perPageOptions())
            ->filter(fn (int $option): bool => $option > 0)
            ->unique()
            ->values()
            ->all();

        if (! in_array($defaultPerPage, $options, true)) {
            array_unshift($options, $defaultPerPage);
        }

        return $options;
    }

    /**
     * @return list<array<string, mixed>>
     */
    public static function recordActions(Model $record, Authenticatable $user): array
    {
        return [];
    }

    /**
     * @return list<array<string, mixed>>
     */
    public static function bulkActions(Authenticatable $user): array
    {
        if (! static::canDelete()) {
            return [];
        }

        return [[
            'key' => 'delete',
            'label' => __('admin-panel::messages.crud.actions.delete'),
            'icon' => 'delete-bin-line',
            'variant' => 'destructive',
            'confirmation' => [
                'title' => __('admin-panel::messages.crud.delete.selected_title', [
                    'resource' => static::title(),
                ]),
                'description' => __('admin-panel::messages.crud.delete.selected_description'),
                'confirmLabel' => __('admin-panel::messages.crud.actions.delete'),
                'processingLabel' => __('admin-panel::messages.crud.delete.processing'),
            ],
        ]];
    }

    public static function bulkActionAbility(string $action): string
    {
        return match ($action) {
            'delete' => 'delete',
            default => $action,
        };
    }

    /**
     * @param  Collection<int, Model>  $records
     */
    public static function handleBulkAction(
        string $action,
        Collection $records,
        Authenticatable $user,
    ): void {
        match ($action) {
            'delete' => $records->each->delete(),
            default => throw new \InvalidArgumentException("Unsupported bulk action [{$action}]."),
        };
    }

    /**
     * @return array<string, mixed>
     */
    public static function rules(?Model $record = null): array
    {
        return collect(self::fieldDefinitions())
            ->filter(fn (array $field): bool => array_key_exists('rules', $field))
            ->mapWithKeys(function (array $field) use ($record): array {
                $rules = $field['rules'];

                return [
                    $field['name'] => $rules instanceof Closure
                        ? $rules($record)
                        : $rules,
                ];
            })
            ->all();
    }

    /**
     * @return array{label: string, icon: string, sort?: int, group?: string, groupSort?: int}|null
     */
    public static function navigation(): ?array
    {
        return null;
    }

    public static function indexComponent(): string
    {
        return 'crud/index';
    }

    public static function showComponent(): string
    {
        return 'crud/show';
    }

    public static function showPageComponent(): string
    {
        return static::showComponent();
    }

    public static function showWithinIndex(Request $request, Model $record): bool
    {
        return false;
    }

    public static function createComponent(): string
    {
        return 'crud/form';
    }

    public static function createSheetComponent(): string
    {
        return static::createComponent();
    }

    public static function createWithinIndex(Request $request): bool
    {
        return false;
    }

    public static function editComponent(): string
    {
        return 'crud/form';
    }

    public static function editSheetComponent(): string
    {
        return static::editComponent();
    }

    public static function editWithinIndex(Request $request, Model $record): bool
    {
        return false;
    }

    /**
     * @return array<string, mixed>
     */
    public static function showProps(Model $record): array
    {
        return [];
    }

    /**
     * @return array<string, mixed>
     */
    public static function indexProps(): array
    {
        return [];
    }

    /**
     * @return array<string, mixed>
     */
    public static function createProps(): array
    {
        return [];
    }

    /**
     * @return array<string, mixed>
     */
    public static function editProps(Model $record): array
    {
        return [];
    }

    /**
     * @param  array<string, mixed>  $attributes
     * @return array<string, mixed>
     */
    public static function prepareForValidation(array $attributes, ?Model $record = null): array
    {
        return $attributes;
    }

    /**
     * @param  array<string, mixed>  $attributes
     * @return array<string, mixed>
     */
    public static function prepareForPersistence(array $attributes): array
    {
        return $attributes;
    }

    /**
     * @param  array<string, mixed>  $attributes
     * @return array<string, mixed>
     */
    public static function prepareForCreate(array $attributes): array
    {
        return static::prepareForPersistence($attributes);
    }

    public static function createRecord(array $attributes, Authenticatable $user): Model
    {
        $record = new (static::model());
        $record->fill(static::prepareForCreate($attributes));
        $record->save();

        return $record;
    }

    /**
     * @param  array<string, mixed>  $attributes
     * @return array<string, mixed>
     */
    public static function prepareForUpdate(array $attributes, Model $record): array
    {
        return static::prepareForPersistence($attributes);
    }

    public static function deleteRecord(Model $record, Authenticatable $user): void
    {
        $record->delete();
    }

    /**
     * @return array<string, mixed>
     */
    public static function definition(): array
    {
        return [
            'title' => static::title(),
            'singularLabel' => static::singularLabel(),
            'description' => static::description(),
            'showRowActions' => static::showRowActions(),
            'columns' => self::normalizeColumns(),
            'fields' => self::normalizeFields(),
            'canCreate' => static::canCreate(),
            'canUpdate' => static::canUpdate(),
            'canDelete' => static::canDelete(),
            'pagination' => [
                'defaultPerPage' => max(1, static::perPage()),
                'perPageOptions' => static::resolvedPerPageOptions(),
            ],
        ];
    }

    /**
     * @return array{key: mixed, title: string, values: array<string, mixed>}
     */
    public static function record(Model $record): array
    {
        $names = collect(static::columns())
            ->flatMap(fn (array $column): array => array_filter([
                $column['name'],
                $column['subtitle'] ?? null,
                $column['avatar'] ?? null,
            ], is_string(...)))
            ->merge(
                collect(self::fieldDefinitions())
                    ->reject(fn (array $field): bool => ($field['writeOnly'] ?? false) === true)
                    ->flatMap(fn (array $field): array => array_filter([
                        $field['name'],
                        $field['preview'] ?? null,
                    ], is_string(...))),
            )
            ->unique();

        return [
            'key' => $record->getAttribute(static::routeKeyName()),
            'title' => static::recordTitle($record),
            'values' => $names->mapWithKeys(fn (string $name): array => [
                $name => self::serializeValue(data_get($record, $name)),
            ])->all(),
        ];
    }

    /**
     * @return array{key: mixed, title: string, values: array<string, mixed>}
     */
    public static function recordForIndex(Model $record): array
    {
        $serialized = static::record($record);
        $detailOnlyColumns = collect(static::columns())
            ->filter(fn (array $column): bool => ($column['detailOnly'] ?? false) === true)
            ->pluck('name')
            ->all();
        $serialized['values'] = Arr::except($serialized['values'], $detailOnlyColumns);

        return $serialized;
    }

    /**
     * @return list<string>
     */
    public static function searchableColumns(): array
    {
        return collect(static::columns())
            ->flatMap(function (array $column): array {
                $searchable = $column['searchable'] ?? false;

                if ($searchable === true) {
                    return [$column['name']];
                }

                return is_array($searchable)
                    ? array_values(array_filter($searchable, is_string(...)))
                    : [];
            })
            ->unique()
            ->values()
            ->all();
    }

    /**
     * @return list<string>
     */
    public static function sortableColumns(): array
    {
        return collect(static::columns())
            ->filter(fn (array $column): bool => ($column['sortable'] ?? false) === true)
            ->pluck('name')
            ->values()
            ->all();
    }

    /**
     * @return array{column: string, direction: 'asc'|'desc'}|null
     */
    public static function defaultSort(): ?array
    {
        foreach (static::columns() as $column) {
            $direction = $column['defaultSort'] ?? null;

            if (
                ($column['sortable'] ?? false) === true
                && in_array($direction, ['asc', 'desc'], true)
            ) {
                return [
                    'column' => $column['name'],
                    'direction' => $direction,
                ];
            }
        }

        return null;
    }

    /**
     * @return array<string, array{type: string, operators: list<string>, options: list<string>}>
     */
    public static function filterableColumns(): array
    {
        return collect(static::columns())
            ->mapWithKeys(function (array $column): array {
                $filter = self::filterDefinition($column);

                return $filter === null ? [] : [$column['name'] => $filter];
            })
            ->all();
    }

    /**
     * @return list<array<string, mixed>>
     */
    private static function normalizeColumns(): array
    {
        return array_map(function (array $column): array {
            $filter = self::filterDefinition($column);

            return [
                'type' => 'text',
                'searchable' => false,
                'sortable' => false,
                'filterable' => $filter !== null,
                ...$column,
                'filter' => $filter,
            ];
        }, static::columns());
    }

    /**
     * @param  array<string, mixed>  $column
     * @return array{type: string, operators: list<string>, options: list<string>}|null
     */
    private static function filterDefinition(array $column): ?array
    {
        if (($column['filterable'] ?? false) !== true && ! array_key_exists('filter', $column)) {
            return null;
        }

        $filter = is_array($column['filter'] ?? null) ? $column['filter'] : [];
        $type = $filter['type'] ?? (($column['type'] ?? null) === 'boolean'
            ? 'select'
            : (empty($column['options']) ? 'text' : 'select'));

        if (! in_array($type, ['select', 'text', 'date', 'number'], true)) {
            return null;
        }

        $defaultOperators = match ($type) {
            'select' => ['is', 'is_not'],
            'text' => ['contains', 'is', 'empty'],
            'date' => ['before', 'after', 'between', 'empty'],
            'number' => ['is', 'greater_than', 'less_than', 'between'],
        };
        $operators = $filter['operators'] ?? $defaultOperators;

        if (! is_array($operators) || array_diff($operators, $defaultOperators) !== []) {
            return null;
        }

        return [
            'type' => $type,
            'operators' => array_values($operators),
            'options' => ($column['type'] ?? null) === 'boolean'
                ? ['0', '1']
                : array_map(strval(...), array_keys($column['options'] ?? [])),
        ];
    }

    /**
     * @return list<array<string, mixed>>
     */
    private static function normalizeFields(): array
    {
        return array_map(
            fn (array $item): array => array_key_exists('fields', $item)
                ? [
                    'columns' => $item['columns'],
                    'fields' => array_map(self::normalizeField(...), $item['fields']),
                ]
                : self::normalizeField($item),
            static::fields(),
        );
    }

    /**
     * @return list<array<string, mixed>>
     */
    private static function fieldDefinitions(): array
    {
        return collect(static::fields())
            ->flatMap(fn (array $item): array => array_key_exists('fields', $item)
                ? $item['fields']
                : [$item])
            ->all();
    }

    /**
     * @param  array<string, mixed>  $field
     * @return array<string, mixed>
     */
    private static function normalizeField(array $field): array
    {
        unset($field['rules']);

        return [
            'type' => 'text',
            'required' => false,
            'requiredOnCreate' => false,
            'writeOnly' => false,
            ...$field,
        ];
    }

    private static function serializeValue(mixed $value): mixed
    {
        return match (true) {
            $value instanceof BackedEnum => $value->value,
            $value instanceof DateTimeInterface => $value->format(DateTimeInterface::ATOM),
            default => $value,
        };
    }
}
