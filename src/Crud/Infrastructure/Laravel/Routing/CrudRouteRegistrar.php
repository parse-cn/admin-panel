<?php

namespace Parse\AdminPanel\Crud\Infrastructure\Laravel\Routing;

use Illuminate\Support\Facades\Route;
use Parse\AdminPanel\Crud\Definition\CrudResourceRegistry;
use Parse\AdminPanel\Crud\Http\Controllers\CrudController;

final class CrudRouteRegistrar
{
    public function __construct(private readonly CrudResourceRegistry $resources) {}

    /** @param list<array{uri: string, resource: class-string, name: string, actions: list<string>}>|null $registrations */
    public function register(?array $registrations = null): void
    {
        foreach ($registrations ?? $this->resources->registrations() as $registration) {
            $this->registerResource($registration);
        }
    }

    /** @param array{uri: string, resource: class-string, name: string, actions: list<string>} $registration */
    private function registerResource(array $registration): void
    {
        $uri = $registration['uri'];
        $resource = $registration['resource'];
        $name = $registration['name'];
        $actions = $registration['actions'];

        $routes = [
            'index' => fn () => Route::get($uri, [CrudController::class, 'index']),
            'bulk' => fn () => Route::post("{$uri}/bulk-actions", [CrudController::class, 'bulk']),
            'create' => fn () => Route::get("{$uri}/create", [CrudController::class, 'create']),
            'store' => fn () => Route::post($uri, [CrudController::class, 'store']),
            'show' => fn () => Route::get("{$uri}/{record}", [CrudController::class, 'show']),
            'edit' => fn () => Route::get("{$uri}/{record}/edit", [CrudController::class, 'edit']),
            'update' => fn () => Route::put("{$uri}/{record}", [CrudController::class, 'update']),
            'destroy' => fn () => Route::delete("{$uri}/{record}", [CrudController::class, 'destroy']),
        ];

        foreach ($actions as $action) {
            if (isset($routes[$action])) {
                $routes[$action]()->defaults('resource', $resource)->name($action === 'index' ? $name : "{$name}.{$action}");
            }
        }
    }
}
