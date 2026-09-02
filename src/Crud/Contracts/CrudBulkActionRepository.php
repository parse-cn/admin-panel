<?php

namespace Parse\AdminPanel\Crud\Contracts;

interface CrudBulkActionRepository
{
    /** @return list<mixed> */
    public function findMany(
        string $resource,
        array $recordKeys,
        array $context = [],
        bool $isWidget = false,
    ): array;

    public function ability(string $resource, string $action): string;

    public function execute(string $resource, string $action, array $records, mixed $actor): void;
}
