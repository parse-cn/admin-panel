<?php

namespace Parse\AdminPanel\Crud\Application\Commands;

final readonly class DeleteRecordCommand
{
    public function __construct(
        public string $resource,
        public string $recordKey,
        public mixed $actor,
        /** @var array<string, mixed> */
        public array $context = [],
        public bool $isWidget = false,
    ) {}
}
