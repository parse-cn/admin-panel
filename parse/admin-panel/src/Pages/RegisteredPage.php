<?php

namespace Parse\AdminPanel\Pages;

final readonly class RegisteredPage
{
    /**
     * @param  class-string|array{class-string, non-empty-string}  $action
     * @param  array{
     *     label: string,
     *     icon: string,
     *     group?: string,
     *     groupSort?: int,
     *     sort?: int
     * }|null  $navigation
     */
    public function __construct(
        public string $uri,
        public string $name,
        public string|array $action,
        public ?array $navigation,
    ) {}
}
