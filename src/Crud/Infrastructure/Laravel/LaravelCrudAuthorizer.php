<?php

namespace Parse\AdminPanel\Crud\Infrastructure\Laravel;

use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Contracts\Auth\Authenticatable;
use Parse\AdminPanel\Crud\Contracts\CrudAuthorizer;
use Parse\AdminPanel\Crud\Infrastructure\Laravel\Resources\EloquentCrudResource as CrudResource;

final class LaravelCrudAuthorizer implements CrudAuthorizer
{
    public function authorize(string $resource, string $ability, mixed $actor, mixed $record = null): mixed
    {
        if (! $actor instanceof Authenticatable
            || ! is_subclass_of($resource, CrudResource::class)
            || ! $resource::authorize($ability, $actor, $record)) {
            throw new AuthorizationException;
        }

        return $actor;
    }
}
