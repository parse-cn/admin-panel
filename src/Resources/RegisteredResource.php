<?php

namespace Parse\AdminPanel\Resources;

final readonly class RegisteredResource
{
    /**
     * @param  class-string<AdminPanelResource>  $resource
     * @param  list<string>|null  $only
     * @param  list<string>  $except
     */
    public function __construct(
        public string $uri,
        public string $resource,
        public ?array $only,
        public array $except,
    ) {}
}
