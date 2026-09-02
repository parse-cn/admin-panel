<?php

namespace Parse\AdminPanel\Crud\Infrastructure\Laravel;

use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Parse\AdminPanel\Crud\Contracts\CrudBulkActionRepository;
use Parse\AdminPanel\Crud\Infrastructure\Laravel\Resources\EloquentCrudResource as CrudResource;

final readonly class EloquentCrudBulkActionRepository implements CrudBulkActionRepository
{
    public function __construct(private Request $request) {}

    public function findMany(
        string $resource,
        array $recordKeys,
        array $context = [],
        bool $isWidget = false,
    ): array {
        $resource = $this->resource($resource);
        $query = $isWidget
            ? $resource::queryForWidget($this->request, $context)
            : $resource::query();
        $records = $query->whereIn($resource::routeKeyName(), $recordKeys)->get();
        $resolvedKeys = $records
            ->map(fn (Model $record): string => (string) $record->getAttribute($resource::routeKeyName()))
            ->all();

        if (count(array_diff($recordKeys, $resolvedKeys)) > 0) {
            throw ValidationException::withMessages([
                'keys' => 'One or more selected records are unavailable.',
            ]);
        }

        return $records->all();
    }

    public function execute(string $resource, string $action, array $records, mixed $actor): void
    {
        $resource = $this->resource($resource);

        $resource::handleBulkAction($action, new Collection($records), $actor);
    }

    public function ability(string $resource, string $action): string
    {
        return $this->resource($resource)::bulkActionAbility($action);
    }

    /** @return class-string<CrudResource> */
    private function resource(string $resource): string
    {
        if (! is_subclass_of($resource, CrudResource::class)) {
            throw new \InvalidArgumentException("Invalid CRUD resource [{$resource}].");
        }

        return $resource;
    }
}
