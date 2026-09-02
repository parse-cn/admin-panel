<?php

namespace Parse\AdminPanel\Crud\Application;

final readonly class ListRecordsQuery
{
    /** @param array<string, mixed> $filters */
    public function __construct(
        public string $resource,
        public string $search = '',
        public string $sort = '',
        public string $direction = 'desc',
        public int $perPage = 10,
        public array $filters = [],
        /** @var array<string, mixed> */
        public array $context = [],
        public bool $isWidget = false,
    ) {}
}
