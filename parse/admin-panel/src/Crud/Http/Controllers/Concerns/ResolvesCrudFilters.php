<?php

namespace Parse\AdminPanel\Crud\Http\Controllers\Concerns;

use Illuminate\Http\Request;
use Parse\AdminPanel\Crud\Infrastructure\Laravel\Resources\EloquentCrudResource as CrudResource;

trait ResolvesCrudFilters
{
    /**
     * @param  class-string<CrudResource>  $resource
     * @return list<array{field: string, operator: string, values: list<string>}>
     */
    private function filters(Request $request, string $resource): array
    {
        $requestedFilters = $request->input('filters', []);

        if (! is_array($requestedFilters)) {
            return [];
        }

        $definitions = $resource::filterableColumns();

        return collect($requestedFilters)
            ->filter(fn (mixed $filter): bool => is_array($filter))
            ->map(function (array $filter) use ($definitions): ?array {
                $field = $filter['field'] ?? null;
                $operator = $filter['operator'] ?? null;
                $values = $filter['values'] ?? [];

                if (
                    ! is_string($field)
                    || ! is_string($operator)
                    || ! is_array($values)
                    || ! isset($definitions[$field])
                    || ! in_array($operator, $definitions[$field]['operators'], true)
                ) {
                    return null;
                }

                $values = array_values(array_filter($values, is_string(...)));

                if ($operator === 'empty') {
                    return $values === [] ? compact('field', 'operator', 'values') : null;
                }

                if (
                    ($operator === 'between' && count($values) !== 2)
                    || ($operator !== 'between' && count($values) !== 1)
                    || in_array('', $values, true)
                ) {
                    return null;
                }

                if (
                    $definitions[$field]['type'] === 'select'
                    && ! in_array($values[0], $definitions[$field]['options'], true)
                ) {
                    return null;
                }

                if (
                    $definitions[$field]['type'] === 'number'
                    && collect($values)->contains(fn (string $value): bool => ! is_numeric($value))
                ) {
                    return null;
                }

                if (
                    $definitions[$field]['type'] === 'date'
                    && collect($values)->contains(fn (string $value): bool => strtotime($value) === false)
                ) {
                    return null;
                }

                return compact('field', 'operator', 'values');
            })
            ->filter()
            ->values()
            ->all();
    }
}
