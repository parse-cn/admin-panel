<?php

namespace Parse\AdminPanel\Crud\Definition;

use InvalidArgumentException;

/**
 * Startup registry for developer-defined CRUD resources.
 *
 * Route generation is performed by the Laravel infrastructure registrar.
 */
final class CrudResourceRegistry
{
    /**
     * @var list<string>
     */
    private const ACTIONS = [
        'index',
        'create',
        'store',
        'show',
        'edit',
        'update',
        'destroy',
        'bulk',
    ];

    /** @var array<string, list<class-string>> */
    private array $resources = [];

    /** @var array<class-string, list<string>> */
    private array $resourceActions = [];

    /** @var list<array{uri: string, resource: class-string, name: string, actions: list<string>}> */
    private array $registrations = [];

    /**
     * @param  class-string  $resource
     * @param  list<string>|null  $only
     * @param  list<string>  $except
     */
    public function register(
        string $uri,
        string $resource,
        ?array $only = null,
        array $except = [],
    ): void {
        $routeName = $resource::routeName();
        $name = str_contains($routeName, '.')
            ? substr($routeName, strrpos($routeName, '.') + 1)
            : $routeName;
        $group = str_contains($routeName, '.')
            ? substr($routeName, 0, strrpos($routeName, '.'))
            : 'default';
        $actions = array_values(array_diff(
            self::normalizeActions($only ?? self::ACTIONS),
            self::normalizeActions($except),
        ));

        $this->resources[$group][] = $resource;
        $this->resourceActions[$resource] = $actions;
        $this->registrations[] = compact('uri', 'resource', 'name', 'actions');
    }

    /**
     * @param  class-string  $resource
     * @param  list<string>|null  $only
     * @param  list<string>  $except
     */
    public function registerWidget(
        string $resource,
        ?array $only = null,
        array $except = [],
    ): void {
        $routeName = $resource::routeName();
        $group = str_contains($routeName, '.')
            ? substr($routeName, 0, strrpos($routeName, '.'))
            : 'default';
        $actions = array_values(array_diff(
            self::normalizeActions($only ?? self::ACTIONS),
            self::normalizeActions($except),
        ));

        $this->resources[$group][] = $resource;
        $this->resourceActions[$resource] = $actions;
    }

    /** @return list<class-string> */
    public function resources(string $group = 'default'): array
    {
        return array_values(array_unique($this->resources[$group] ?? []));
    }

    /** @return class-string|null */
    public function resolve(string $routeName): ?string
    {
        foreach ($this->resources as $resources) {
            foreach ($resources as $resource) {
                if ($resource::routeName() === $routeName) {
                    return $resource;
                }
            }
        }

        return null;
    }

    /** @param class-string $resource */
    public function allows(string $resource, string $action): bool
    {
        return in_array($action, $this->resourceActions[$resource] ?? [], true);
    }

    /** @return list<array{uri: string, resource: class-string, name: string, actions: list<string>}> */
    public function registrations(): array
    {
        return $this->registrations;
    }

    /**
     * @param  list<string>  $actions
     * @return list<string>
     */
    private static function normalizeActions(array $actions): array
    {
        $invalidActions = array_diff($actions, self::ACTIONS);

        if ($invalidActions !== []) {
            throw new InvalidArgumentException(
                'Invalid CRUD actions: '.implode(', ', $invalidActions),
            );
        }

        return array_values(array_unique($actions));
    }
}
