<?php

namespace Parse\AdminPanel\Crud\Application\Commands;

final readonly class ExecuteBulkActionCommand
{
    /** @param list<string> $recordKeys */
    public function __construct(
        public string $resource,
        public string $action,
        public array $recordKeys,
        public mixed $actor,
        /** @var array<string, mixed> */
        public array $context = [],
        public bool $isWidget = false,
    ) {}
}
