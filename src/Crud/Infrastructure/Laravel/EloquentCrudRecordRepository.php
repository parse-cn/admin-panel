<?php

namespace Parse\AdminPanel\Crud\Infrastructure\Laravel;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Parse\AdminPanel\Crud\Contracts\CrudRecordRepository;
use Parse\AdminPanel\Crud\Infrastructure\Laravel\Resources\EloquentCrudResource as CrudResource;

final class EloquentCrudRecordRepository implements CrudRecordRepository
{
    public function __construct(private readonly Request $request) {}

    public function create(string $resource, array $attributes, mixed $actor): mixed
    {
        return $this->resource($resource)::createRecord($attributes, $actor);
    }

    public function find(
        string $resource,
        string $recordKey,
        array $context = [],
        bool $isWidget = false,
    ): mixed {
        $resource = $this->resource($resource);
        $query = $isWidget
            ? $resource::queryForWidget($this->request, $context)
            : $resource::query();

        return $query->where($resource::routeKeyName(), $recordKey)->firstOrFail();
    }

    public function update(string $resource, mixed $record, array $attributes): mixed
    {
        if (! $record instanceof Model) {
            throw new \InvalidArgumentException('Invalid CRUD record.');
        }

        $record->update($this->resource($resource)::prepareForUpdate($attributes, $record));

        return $record;
    }

    public function delete(string $resource, mixed $record, mixed $actor): void
    {
        if (! $record instanceof Model) {
            throw new \InvalidArgumentException('Invalid CRUD record.');
        }

        $this->resource($resource)::deleteRecord($record, $actor);
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
