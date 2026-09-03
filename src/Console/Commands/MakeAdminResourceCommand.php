<?php

namespace Parse\AdminPanel\Console\Commands;

use Illuminate\Console\GeneratorCommand;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Filesystem\Filesystem;
use Illuminate\Support\Str;
use Parse\AdminPanel\Infrastructure\Laravel\Panel\PanelManager;
use Parse\AdminPanel\Infrastructure\Laravel\Panel\PanelRuntime;
use RuntimeException;
use Symfony\Component\Console\Input\InputOption;

final class MakeAdminResourceCommand extends GeneratorCommand
{
    protected $name = 'make:admin-resource';

    protected $description = 'Create a new admin panel CRUD resource';

    protected $type = 'Admin panel resource';

    public function __construct(
        Filesystem $files,
        private readonly PanelManager $panels,
    ) {
        parent::__construct($files);
    }

    public function handle(): ?bool
    {
        $result = parent::handle();

        if ($result === false) {
            return false;
        }

        $resource = $this->qualifyClass($this->getNameInput());

        $this->components->info('Register the resource in routes/admin-panel.php:');
        $this->line(sprintf(
            "AdminPanel::panel('%s')->resource('%s', \\%s::class);",
            $this->panel()->id,
            $this->resourceUri(),
            $resource,
        ));

        return null;
    }

    protected function getStub(): string
    {
        return __DIR__.'/../../../stubs/admin-panel-resource.stub';
    }

    protected function getDefaultNamespace($rootNamespace): string
    {
        $namespace = $this->stringOption('namespace');

        if ($namespace === null) {
            return "{$rootNamespace}\\Admin\\Resources";
        }

        $namespace = trim($namespace, '\\');

        return Str::startsWith($namespace, trim($rootNamespace, '\\').'\\')
            ? $namespace
            : trim($rootNamespace, '\\').'\\'.$namespace;
    }

    protected function getNameInput(): string
    {
        $name = parent::getNameInput();

        return Str::endsWith($name, 'Resource') ? $name : "{$name}Resource";
    }

    protected function buildClass($name): string
    {
        $model = $this->modelClass();
        $modelName = class_basename($model);
        $uri = $this->resourceUri($modelName);
        $route = Str::of($uri)
            ->replace(['/', '-', '.'], '_')
            ->snake()
            ->toString();
        $singularLabel = Str::headline($modelName);
        $title = Str::plural($singularLabel);
        $group = $this->stringOption('group') ?? 'Resources';
        $icon = $this->stringOption('icon') ?? 'table-line';
        $modelInstance = $this->modelInstance($model);
        $columns = $this->schemaColumns($modelInstance);

        return str_replace(
            [
                '{{ namespacedModel }}',
                '{{ model }}',
                '{{ routeName }}',
                '{{ title }}',
                '{{ singularLabel }}',
                '{{ navigationGroup }}',
                '{{ navigationIcon }}',
                '{{ columns }}',
                '{{ fields }}',
            ],
            [
                $model,
                $modelName,
                "{$this->panel()->routeName}.{$route}",
                $title,
                $singularLabel,
                $group,
                $icon,
                $this->exportArray($this->resourceColumns($columns, $modelInstance), 2),
                $this->exportArray($this->resourceFields($columns, $modelInstance), 2),
            ],
            parent::buildClass($name),
        );
    }

    /**
     * @return class-string
     */
    private function modelClass(): string
    {
        $model = $this->stringOption('model')
            ?? Str::beforeLast(class_basename($this->getNameInput()), 'Resource');

        return $this->qualifyModel($model);
    }

    private function resourceUri(?string $modelName = null): string
    {
        return $this->stringOption('uri')
            ?? Str::kebab(Str::pluralStudly($modelName ?? class_basename($this->modelClass())));
    }

    private function stringOption(string $name): ?string
    {
        $value = $this->option($name);

        return is_string($value) && $value !== '' ? $value : null;
    }

    /**
     * @return array<int, array<int, int|string|null>>
     */
    protected function getOptions(): array
    {
        return [
            ['model', 'm', InputOption::VALUE_OPTIONAL, 'The model class represented by the resource'],
            ['namespace', 'N', InputOption::VALUE_OPTIONAL, 'The namespace for the generated resource'],
            ['panel', 'p', InputOption::VALUE_OPTIONAL, 'The admin panel identifier', 'admin'],
            ['uri', null, InputOption::VALUE_OPTIONAL, 'The URI used to register the resource'],
            ['group', null, InputOption::VALUE_OPTIONAL, 'The sidebar navigation group', 'Resources'],
            ['icon', null, InputOption::VALUE_OPTIONAL, 'The sidebar icon name', 'table-line'],
            ['force', 'f', InputOption::VALUE_NONE, 'Create the class even if the resource already exists'],
        ];
    }

    private function panel(): PanelRuntime
    {
        return $this->panels->panel(
            $this->stringOption('panel') ?? 'admin',
        );
    }

    /**
     * @param  class-string  $model
     */
    private function modelInstance(string $model): Model
    {
        if (! class_exists($model) || ! is_subclass_of($model, Model::class)) {
            throw new RuntimeException("The model [{$model}] does not exist or is not an Eloquent model.");
        }

        return new $model;
    }

    /**
     * @return list<array{name: string, type: string, type_name: string, nullable: bool, default: mixed, auto_increment: bool, generation: array<string, mixed>|null}>
     */
    private function schemaColumns(Model $model): array
    {
        $schema = $model->getConnection()->getSchemaBuilder();
        $table = $model->getTable();

        if (! $schema->hasTable($table)) {
            $modelClass = $model::class;

            throw new RuntimeException("The table [{$table}] for model [{$modelClass}] does not exist.");
        }

        return $schema->getColumns($table);
    }

    /**
     * @param  list<array<string, mixed>>  $columns
     * @return list<array<string, mixed>>
     */
    private function resourceColumns(array $columns, Model $model): array
    {
        $hidden = $model->getHidden();
        $visibleColumns = collect($columns)
            ->reject(fn (array $column): bool => in_array($column['name'], $hidden, true)
                || $this->isBinaryColumn($column))
            ->values();
        $linkColumn = $visibleColumns->first(
            fn (array $column): bool => ! $this->isDateColumn($column) && ! $this->isBinaryColumn($column),
        );

        return $visibleColumns
            ->map(function (array $column) use ($linkColumn): array {
                $definition = [
                    'name' => $column['name'],
                    'label' => Str::headline($column['name']),
                ];

                if ($this->isDateColumn($column)) {
                    $definition['type'] = 'datetime';
                } elseif ($this->isBooleanColumn($column)) {
                    $definition['type'] = 'boolean';
                }

                if ($this->isSearchableColumn($column)) {
                    $definition['searchable'] = true;
                }

                if ($this->isSortableColumn($column)) {
                    $definition['sortable'] = true;
                }

                if ($column === $linkColumn) {
                    $definition['link'] = 'show';
                }

                $filterType = $this->filterType($column);

                if ($filterType !== null) {
                    $definition['filter'] = ['type' => $filterType];
                }

                return $definition;
            })
            ->all();
    }

    /**
     * @param  list<array<string, mixed>>  $columns
     * @return list<array<string, mixed>>
     */
    private function resourceFields(array $columns, Model $model): array
    {
        $excluded = array_filter([
            ...$model->getHidden(),
            $model->getCreatedAtColumn(),
            $model->getUpdatedAtColumn(),
            method_exists($model, 'getDeletedAtColumn') ? $model->getDeletedAtColumn() : null,
        ]);

        return collect($columns)
            ->reject(fn (array $column): bool => in_array($column['name'], $excluded, true)
                || ($column['auto_increment'] ?? false)
                || ($column['generation'] ?? null) !== null
                || $this->isBinaryColumn($column))
            ->map(function (array $column): array {
                $required = ! ($column['nullable'] ?? false) && ($column['default'] ?? null) === null;
                $definition = [
                    'name' => $column['name'],
                    'label' => Str::headline($column['name']),
                ];
                $fieldType = $this->fieldType($column);

                if ($fieldType !== 'text') {
                    $definition['type'] = $fieldType;
                }

                if ($required) {
                    $definition['required'] = true;
                }

                $definition['rules'] = $this->validationRules($column, $required);

                return $definition;
            })
            ->values()
            ->all();
    }

    /**
     * @param  array<string, mixed>  $column
     * @return list<string>
     */
    private function validationRules(array $column, bool $required): array
    {
        $rules = [$required ? 'required' : 'nullable'];
        $type = $column['type_name'];

        if ($this->isBooleanColumn($column)) {
            $rules[] = 'boolean';
        } elseif ($this->isIntegerColumn($column)) {
            $rules[] = 'integer';
        } elseif ($this->isNumericColumn($column)) {
            $rules[] = 'numeric';
        } elseif ($this->isDateColumn($column)) {
            $rules[] = 'date';
        } elseif (in_array($type, ['json', 'jsonb'], true)) {
            $rules[] = 'json';
        } else {
            $rules[] = 'string';

            if (preg_match('/\\((\\d+)\\)/', $column['type'], $matches) === 1) {
                $rules[] = 'max:'.$matches[1];
            }
        }

        return $rules;
    }

    /** @param array<string, mixed> $column */
    private function fieldType(array $column): string
    {
        return match (true) {
            $this->isBooleanColumn($column) => 'boolean',
            $this->isNumericColumn($column), $this->isIntegerColumn($column) => 'number',
            Str::contains($column['name'], 'email') => 'email',
            Str::contains($column['name'], ['image', 'avatar', 'logo']) => 'image-url',
            default => 'text',
        };
    }

    /** @param array<string, mixed> $column */
    private function filterType(array $column): ?string
    {
        return match (true) {
            $this->isBooleanColumn($column) => 'select',
            $this->isDateColumn($column) => 'date',
            $this->isNumericColumn($column), $this->isIntegerColumn($column) => 'number',
            $this->isSearchableColumn($column) => 'text',
            default => null,
        };
    }

    /** @param array<string, mixed> $column */
    private function isBooleanColumn(array $column): bool
    {
        return in_array($column['type_name'], ['bool', 'boolean'], true)
            || in_array($column['type'], ['tinyint(1)', 'bit(1)'], true);
    }

    /** @param array<string, mixed> $column */
    private function isIntegerColumn(array $column): bool
    {
        return in_array($column['type_name'], [
            'tinyint', 'smallint', 'mediumint', 'int', 'integer', 'bigint',
        ], true) && ! $this->isBooleanColumn($column);
    }

    /** @param array<string, mixed> $column */
    private function isNumericColumn(array $column): bool
    {
        return in_array($column['type_name'], [
            'decimal', 'numeric', 'float', 'double', 'real',
        ], true);
    }

    /** @param array<string, mixed> $column */
    private function isDateColumn(array $column): bool
    {
        return in_array($column['type_name'], [
            'date', 'datetime', 'datetimetz', 'timestamp', 'timestamptz', 'time', 'timetz',
        ], true);
    }

    /** @param array<string, mixed> $column */
    private function isBinaryColumn(array $column): bool
    {
        return in_array($column['type_name'], [
            'binary', 'varbinary', 'blob', 'tinyblob', 'mediumblob', 'longblob',
        ], true);
    }

    /** @param array<string, mixed> $column */
    private function isSearchableColumn(array $column): bool
    {
        return in_array($column['type_name'], [
            'char', 'varchar', 'text', 'tinytext', 'mediumtext', 'longtext', 'enum', 'set',
        ], true);
    }

    /** @param array<string, mixed> $column */
    private function isSortableColumn(array $column): bool
    {
        return ! in_array($column['type_name'], [
            'text', 'tinytext', 'mediumtext', 'longtext', 'json', 'jsonb',
            'binary', 'varbinary', 'blob', 'tinyblob', 'mediumblob', 'longblob',
        ], true);
    }

    /**
     * @param  array<mixed>  $values
     */
    private function exportArray(array $values, int $level = 0): string
    {
        if ($values === []) {
            return '[]';
        }

        $indent = str_repeat('    ', $level);
        $childIndent = str_repeat('    ', $level + 1);
        $isList = array_is_list($values) && ! $this->isBooleanBadgeOptions($values);
        $lines = [];

        foreach ($values as $key => $value) {
            $prefix = $isList ? '' : var_export((string) $key, true).' => ';
            $exported = is_array($value)
                ? $this->exportArray($value, $level + 1)
                : var_export($value, true);
            $lines[] = $childIndent.$prefix.$exported.',';
        }

        return "[\n".implode("\n", $lines)."\n{$indent}]";
    }

    /**
     * @param  array<mixed>  $values
     */
    private function isBooleanBadgeOptions(array $values): bool
    {
        return array_keys($values) === [0, 1]
            && collect($values)->every(fn (mixed $value): bool => is_array($value)
                && array_key_exists('label', $value)
                && array_key_exists('variant', $value));
    }
}
