<?php

namespace Parse\AdminPanel\Pages;

final class AdminPanelDashboard
{
    /**
     * @param  class-string|array{class-string, non-empty-string}  $action
     */
    public function __construct(
        private string|array $action,
        private string $uri = '',
    ) {}

    /**
     * @param  class-string|array{class-string, non-empty-string}  $action
     */
    public function replace(string|array $action, string $uri = ''): void
    {
        $this->action = $action;
        $this->uri = trim($uri, '/');
    }

    /**
     * @return class-string|array{class-string, non-empty-string}
     */
    public function action(): string|array
    {
        return $this->action;
    }

    public function uri(): string
    {
        return $this->uri;
    }
}
