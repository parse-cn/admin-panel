<?php

namespace Parse\AdminPanel\Crud\Contracts;

interface CrudRecordRepository
{
    /** @param array<string, mixed> $context */
    public function find(
        string $resource,
        string $recordKey,
        array $context = [],
        bool $isWidget = false,
    ): mixed;

    /** @param array<string, mixed> $attributes */
    public function create(string $resource, array $attributes, mixed $actor): mixed;

    /** @param array<string, mixed> $attributes */
    public function update(string $resource, mixed $record, array $attributes): mixed;

    public function delete(string $resource, mixed $record, mixed $actor): void;
}
