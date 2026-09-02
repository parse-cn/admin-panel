<?php

namespace Parse\AdminPanel\Crud\Contracts;

interface CrudValidator
{
    /** @param array<string, mixed> $attributes @return array<string, mixed> */
    public function validate(string $resource, array $attributes, mixed $record = null): array;
}
