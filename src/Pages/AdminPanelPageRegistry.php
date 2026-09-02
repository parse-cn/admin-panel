<?php

namespace Parse\AdminPanel\Pages;

use InvalidArgumentException;

final class AdminPanelPageRegistry
{
    /**
     * @var array<string, RegisteredPage>
     */
    private array $pages = [];

    /**
     * @var list<callable(): void>
     */
    private array $routes = [];

    /**
     * @param  class-string|array{class-string, non-empty-string}  $action
     * @param  array{
     *     label: string,
     *     icon: string,
     *     group?: string,
     *     groupSort?: int,
     *     section?: string,
     *     sectionSort?: int,
     *     badge?: string,
     *     sort?: int,
     *     activeRoutes?: list<string>
     * }|null  $navigation
     */
    public function page(
        string $uri,
        string $name,
        string|array $action,
        ?array $navigation,
    ): void {
        $uri = trim($uri, '/');

        if ($uri === '') {
            throw new InvalidArgumentException('Admin panel page URI must not be empty.');
        }

        if ($name === '') {
            throw new InvalidArgumentException('Admin panel page name must not be empty.');
        }

        if (isset($this->pages[$name])) {
            throw new InvalidArgumentException("Admin panel page [{$name}] is already registered.");
        }

        if (collect($this->pages)->contains(
            fn (RegisteredPage $page): bool => $page->uri === $uri,
        )) {
            throw new InvalidArgumentException("Admin panel page URI [{$uri}] is already registered.");
        }

        $navigation = $this->navigation($navigation);

        $this->pages[$name] = new RegisteredPage(
            uri: $uri,
            name: $name,
            action: $action,
            navigation: $navigation,
        );
    }

    /**
     * @return list<RegisteredPage>
     */
    public function pages(): array
    {
        return array_values($this->pages);
    }

    /**
     * @param  callable(): void  $routes
     */
    public function routes(callable $routes): void
    {
        $this->routes[] = $routes;
    }

    /**
     * @return list<callable(): void>
     */
    public function registeredRoutes(): array
    {
        return $this->routes;
    }

    /**
     * @param  array<string, mixed>|null  $navigation
     * @return array{
     *     label: string,
     *     icon: string,
     *     group?: string,
     *     groupSort?: int,
     *     section?: string,
     *     sectionSort?: int,
     *     badge?: string,
     *     sort?: int,
     *     activeRoutes?: list<string>
     * }|null
     */
    private function navigation(?array $navigation): ?array
    {
        if ($navigation === null) {
            return null;
        }

        foreach (['label', 'icon'] as $key) {
            if (! isset($navigation[$key]) || ! is_string($navigation[$key]) || $navigation[$key] === '') {
                throw new InvalidArgumentException(
                    "Admin panel page navigation [{$key}] must be a non-empty string.",
                );
            }
        }

        $resolved = [
            'label' => $navigation['label'],
            'icon' => $navigation['icon'],
        ];

        if (isset($navigation['group'])) {
            if (! is_string($navigation['group']) || $navigation['group'] === '') {
                throw new InvalidArgumentException(
                    'Admin panel page navigation [group] must be a non-empty string.',
                );
            }

            $resolved['group'] = $navigation['group'];
        }

        if (isset($navigation['section'])) {
            if (! is_string($navigation['section']) || $navigation['section'] === '') {
                throw new InvalidArgumentException(
                    'Admin panel page navigation [section] must be a non-empty string.',
                );
            }

            $resolved['section'] = $navigation['section'];
        }

        if (isset($navigation['badge'])) {
            if (! is_string($navigation['badge']) || $navigation['badge'] === '') {
                throw new InvalidArgumentException(
                    'Admin panel page navigation [badge] must be a non-empty string.',
                );
            }

            $resolved['badge'] = $navigation['badge'];
        }

        foreach (['groupSort', 'sectionSort', 'sort'] as $key) {
            if (isset($navigation[$key])) {
                if (! is_int($navigation[$key])) {
                    throw new InvalidArgumentException(
                        "Admin panel page navigation [{$key}] must be an integer.",
                    );
                }

                $resolved[$key] = $navigation[$key];
            }
        }

        if (isset($navigation['activeRoutes'])) {
            if (! is_array($navigation['activeRoutes']) || collect($navigation['activeRoutes'])->contains(fn ($route): bool => ! is_string($route) || $route === '')) {
                throw new InvalidArgumentException(
                    'Admin panel page navigation [activeRoutes] must be a list of non-empty route patterns.',
                );
            }

            $resolved['activeRoutes'] = array_values($navigation['activeRoutes']);
        }

        return $resolved;
    }
}
