<?php

namespace Parse\AdminPanel\Crud\Application\Commands;

final readonly class CreateRecordCommand
{
    /** @param array<string, mixed> $attributes */
    public function __construct(
        public string $resource,
        public array $attributes,
        public mixed $actor,
    ) {}
}
