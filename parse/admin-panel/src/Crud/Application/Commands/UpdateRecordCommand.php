<?php

namespace Parse\AdminPanel\Crud\Application\Commands;

final readonly class UpdateRecordCommand
{
    /** @param array<string, mixed> $attributes */
    public function __construct(
        public string $resource,
        public string $recordKey,
        public array $attributes,
        public mixed $actor,
        /** @var array<string, mixed> */
        public array $context = [],
        public bool $isWidget = false,
    ) {}
}
