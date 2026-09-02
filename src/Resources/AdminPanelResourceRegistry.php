<?php

namespace Parse\AdminPanel\Resources;

use InvalidArgumentException;

final class AdminPanelResourceRegistry
{
    /**
     * @var array<string, RegisteredResource>
     */
    private array $resources = [];

    public function __construct(
        private readonly string $routeName = 'admin_panel',
    ) {}

    /**
     * @param  class-string<AdminPanelResource>  $resource
     * @param  list<string>|null  $only
     * @param  list<string>  $except
     */
    public function resource(
        string $uri,
        string $resource,
        ?array $only = null,
        array $except = [],
    ): void {
        $uri = trim($uri, '/');

        if ($uri === '' || str_contains($uri, '{')) {
            throw new InvalidArgumentException('The admin panel resource URI must be a non-empty static path.');
        }

        if (! is_subclass_of($resource, AdminPanelResource::class)) {
            throw new InvalidArgumentException("Resource [{$resource}] must extend ".AdminPanelResource::class.'.');
        }

        if (! str_starts_with($resource::routeName(), "{$this->routeName}.")) {
            throw new InvalidArgumentException(
                "Resource [{$resource}] route name must start with [{$this->routeName}.].",
            );
        }

        if (isset($this->resources[$uri])) {
            throw new InvalidArgumentException("An admin panel resource is already registered for [{$uri}].");
        }

        $this->resources[$uri] = new RegisteredResource($uri, $resource, $only, $except);
    }

    /**
     * @return list<RegisteredResource>
     */
    public function resources(): array
    {
        return array_values($this->resources);
    }
}
