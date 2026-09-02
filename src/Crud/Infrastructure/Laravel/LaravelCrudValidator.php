<?php

namespace Parse\AdminPanel\Crud\Infrastructure\Laravel;

use Illuminate\Support\Facades\Validator;
use Parse\AdminPanel\Crud\Contracts\CrudValidator;
use Parse\AdminPanel\Crud\Infrastructure\Laravel\Resources\EloquentCrudResource as CrudResource;

final class LaravelCrudValidator implements CrudValidator
{
    public function validate(string $resource, array $attributes, mixed $record = null): array
    {
        if (! is_subclass_of($resource, CrudResource::class)) {
            throw new \InvalidArgumentException("Invalid CRUD resource [{$resource}].");
        }

        $attributes = $resource::prepareForValidation($attributes, $record);

        return Validator::make($attributes, $resource::rules($record))->validate();
    }
}
