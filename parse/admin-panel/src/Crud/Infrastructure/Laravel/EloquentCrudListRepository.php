<?php

namespace Parse\AdminPanel\Crud\Infrastructure\Laravel;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use InvalidArgumentException;
use Parse\AdminPanel\Crud\Application\ListRecordsQuery;
use Parse\AdminPanel\Crud\Contracts\CrudListRepository;
use Parse\AdminPanel\Crud\Infrastructure\Laravel\Resources\EloquentCrudResource as CrudResource;

final readonly class EloquentCrudListRepository implements CrudListRepository
{
    public function __construct(private Request $request) {}

    public function paginate(ListRecordsQuery $query): mixed
    {
        $resource = $this->resource($query->resource);
        $records = $query->isWidget
            ? $resource::queryForWidget($this->request, $query->context)
            : $resource::query();

        $this->applySearch($records, $resource, $query->search);
        $this->applyFilters($records, $query->filters, $resource);

        if ($query->sort !== '') {
            $records->orderBy($query->sort, $query->direction);
        } else {
            $records->latest();
        }

        return $records->paginate($query->perPage)->withQueryString();
    }

    /** @param class-string<CrudResource> $resource */
    private function applySearch(Builder $records, string $resource, string $search): void
    {
        $columns = $resource::searchableColumns();

        if ($search === '' || $columns === []) {
            return;
        }

        if (method_exists($resource, 'applySearch')) {
            $resource::applySearch($records, $search);

            return;
        }

        $records->where(function (Builder $records) use ($columns, $search): void {
            foreach ($columns as $column) {
                $records->orWhere($column, 'like', "%{$search}%");
            }
        });
    }

    /**
     * @param  list<array{field: string, operator: string, values: list<string>}>  $filters
     * @param  class-string<CrudResource>  $resource
     */
    private function applyFilters(Builder $records, array $filters, string $resource): void
    {
        $definitions = $resource::filterableColumns();

        foreach ($filters as $filter) {
            $column = $filter['field'];
            $operator = $filter['operator'];
            $values = $filter['values'];
            $type = $definitions[$column]['type'];

            match ($operator) {
                'is' => $records->where($column, $values[0]),
                'is_not' => $records->where($column, '!=', $values[0]),
                'contains' => $records->whereLike($column, '%'.addcslashes($values[0], '\\%_').'%'),
                'before' => $records->whereDate($column, '<', $values[0]),
                'after' => $records->whereDate($column, '>', $values[0]),
                'greater_than' => $records->where($column, '>', $values[0]),
                'less_than' => $records->where($column, '<', $values[0]),
                'between' => $type === 'date'
                    ? $records->whereDate($column, '>=', $values[0])
                        ->whereDate($column, '<=', $values[1])
                    : $records->whereBetween($column, $values),
                'empty' => $records->where(fn (Builder $records): Builder => $records
                    ->whereNull($column)
                    ->orWhere($column, '')),
                default => throw new InvalidArgumentException('Unsupported CRUD filter operator.'),
            };
        }
    }

    /** @return class-string<CrudResource> */
    private function resource(string $resource): string
    {
        if (! is_subclass_of($resource, CrudResource::class)) {
            throw new InvalidArgumentException("Invalid CRUD resource [{$resource}].");
        }

        return $resource;
    }
}
