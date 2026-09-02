<?php

namespace Parse\AdminPanel\Infrastructure\Laravel\Routing;

use Illuminate\Support\Facades\Route;
use Parse\AdminPanel\Crud\Definition\CrudResourceRegistry;
use Parse\AdminPanel\Crud\Http\Controllers\CrudWidgetController;
use Parse\AdminPanel\Crud\Infrastructure\Laravel\Routing\CrudRouteRegistrar;
use Parse\AdminPanel\Http\Controllers\AuthenticatedSessionController;
use Parse\AdminPanel\Http\Controllers\GlobalSearchController;
use Parse\AdminPanel\Http\Controllers\LocaleController;
use Parse\AdminPanel\Http\Controllers\ProfileController;
use Parse\AdminPanel\Http\Controllers\UploadController;
use Parse\AdminPanel\Http\Middleware\AuthenticateAdminPanel;
use Parse\AdminPanel\Http\Middleware\HandleAdminPanelInertiaRequests;
use Parse\AdminPanel\Http\Middleware\RedirectIfAdminPanelAuthenticated;
use Parse\AdminPanel\Http\Middleware\ResolveAdminPanel;
use Parse\AdminPanel\Http\Middleware\SetAdminPanelLocale;
use Parse\AdminPanel\Infrastructure\Laravel\Panel\PanelManager;

final class PanelRouteRegistrar
{
    public function __construct(
        private readonly PanelManager $panels,
        private readonly CrudResourceRegistry $crudResources,
        private readonly CrudRouteRegistrar $crudRoutes,
    ) {}

    public function register(): void
    {
        foreach ($this->panels->panels() as $panel) {
            Route::group([
                'middleware' => [
                    ...$panel->middleware,
                    ResolveAdminPanel::class.':'.$panel->id,
                    SetAdminPanelLocale::class,
                    HandleAdminPanelInertiaRequests::class.':'.$panel->id,
                ],
                'as' => $panel->routeName.'.',
                'domain' => $panel->domain,
                'prefix' => $panel->prefix,
            ], function () use ($panel): void {
                Route::post('locale', [LocaleController::class, 'update'])->name('locale.update');

                Route::middleware(RedirectIfAdminPanelAuthenticated::using($panel->guard))->group(function (): void {
                    Route::get('login', [AuthenticatedSessionController::class, 'create'])->name('login');
                    Route::post('login', [AuthenticatedSessionController::class, 'store'])->name('login.store');
                });

                Route::middleware(AuthenticateAdminPanel::using($panel->guard))->group(function () use ($panel): void {
                    if ($panel->dashboardUri() !== '') {
                        Route::redirect('/', $panel->dashboardUri());
                    }

                    Route::get($panel->dashboardUri(), $panel->dashboardAction())->name('dashboard');
                    Route::delete('logout', [AuthenticatedSessionController::class, 'destroy'])->name('logout');

                    if ($panel->profileEnabled()) {
                        Route::get('profile', [ProfileController::class, 'show'])->name('profile');
                        Route::put('profile', [ProfileController::class, 'update'])->name('profile.update');
                        Route::put('profile/password', [ProfileController::class, 'updatePassword'])->name('profile.password.update');
                        Route::get('profile/preferences', [ProfileController::class, 'preferences'])->name('profile.preferences');
                        Route::get('profile/security', [ProfileController::class, 'security'])->name('profile.security');
                    }

                    Route::get('global-search', GlobalSearchController::class)->name('global-search');
                    Route::post('uploads/{purpose}', [UploadController::class, 'store'])
                        ->where('purpose', '[a-z0-9]+(?:-[a-z0-9]+)*')
                        ->name('uploads.store');

                    Route::prefix('crud/{resource}')
                        ->where(['resource' => '[A-Za-z0-9._-]+'])
                        ->controller(CrudWidgetController::class)
                        ->group(function (): void {
                            Route::get('data', 'index')->name('crud.widget.data');
                            Route::post('/', 'store')->name('crud.widget.store');
                            Route::put('{record}', 'update')->name('crud.widget.update');
                            Route::delete('{record}', 'destroy')->name('crud.widget.destroy');
                            Route::post('bulk-actions', 'bulk')->name('crud.widget.bulk');
                        });

                    foreach ($panel->pages() as $page) {
                        Route::get($page->uri, $page->action)->name($page->name);
                    }

                    $registeredCrudCount = count($this->crudResources->registrations());

                    foreach ($panel->resources() as $registration) {
                        $this->crudResources->register(
                            $registration->uri,
                            $registration->resource,
                            only: $registration->only,
                            except: $registration->except,
                        );
                    }

                    $this->crudRoutes->register(
                        array_slice($this->crudResources->registrations(), $registeredCrudCount),
                    );

                    foreach ($panel->registeredRoutes() as $routes) {
                        $routes();
                    }
                });
            });
        }
    }
}
