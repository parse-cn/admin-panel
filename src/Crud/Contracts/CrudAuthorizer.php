<?php

namespace Parse\AdminPanel\Crud\Contracts;

interface CrudAuthorizer
{
    public function authorize(string $resource, string $ability, mixed $actor, mixed $record = null): mixed;
}
