<?php

namespace Parse\AdminPanel;

use Illuminate\Support\ServiceProvider;
use Parse\AdminPanel\Console\Commands\InstallAdminPanelCommand;
use Parse\AdminPanel\Console\Commands\MakeAdminResourceCommand;
use Parse\AdminPanel\Crud\Contracts\CrudAuthorizer as CrudAuthorizerContract;
use Parse\AdminPanel\Crud\Contracts\CrudBulkActionRepository;
use Parse\AdminPanel\Crud\Contracts\CrudListRepository;
use Parse\AdminPanel\Crud\Contracts\CrudRecordRepository;
use Parse\AdminPanel\Crud\Contracts\CrudValidator as CrudValidatorContract;
use Parse\AdminPanel\Crud\Contracts\TransactionManager;
use Parse\AdminPanel\Crud\Definition\CrudResourceRegistry;
use Parse\AdminPanel\Crud\Infrastructure\Laravel\EloquentCrudBulkActionRepository;
use Parse\AdminPanel\Crud\Infrastructure\Laravel\EloquentCrudListRepository;
use Parse\AdminPanel\Crud\Infrastructure\Laravel\EloquentCrudRecordRepository;
use Parse\AdminPanel\Crud\Infrastructure\Laravel\LaravelCrudAuthorizer;
use Parse\AdminPanel\Crud\Infrastructure\Laravel\LaravelCrudValidator;
use Parse\AdminPanel\Crud\Infrastructure\Laravel\LaravelTransactionManager;
use Parse\AdminPanel\Crud\Infrastructure\Laravel\Routing\CrudRouteRegistrar;
use Parse\AdminPanel\Domain\Panel\PanelRegistry;
use Parse\AdminPanel\Infrastructure\Laravel\Config\LaravelPanelConfigurationLoader;
use Parse\AdminPanel\Infrastructure\Laravel\Panel\PanelManager;
use Parse\AdminPanel\Infrastructure\Laravel\Panel\PanelRuntimeRegistry;
use Parse\AdminPanel\Routing\AdminPanelRouteLoader;

final class AdminPanelServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(PanelManager::class);
        $this->app->singleton(CrudResourceRegistry::class);
        $this->app->singleton(CrudRouteRegistrar::class);
        $this->app->bind(CrudRecordRepository::class, EloquentCrudRecordRepository::class);
        $this->app->bind(CrudBulkActionRepository::class, EloquentCrudBulkActionRepository::class);
        $this->app->bind(CrudListRepository::class, EloquentCrudListRepository::class);
        $this->app->bind(CrudAuthorizerContract::class, LaravelCrudAuthorizer::class);
        $this->app->bind(CrudValidatorContract::class, LaravelCrudValidator::class);
        $this->app->bind(TransactionManager::class, LaravelTransactionManager::class);
        $this->app->singleton(PanelRegistry::class);
        $this->app->singleton(PanelRuntimeRegistry::class);
        $this->app->singleton(LaravelPanelConfigurationLoader::class);

        $this->mergeConfigFrom(
            __DIR__.'/../config/admin-panel.php',
            'admin-panel',
        );

        config()->set('inertia.pages.paths', [
            ...config('inertia.pages.paths', []),
            __DIR__.'/../resources/js/pages',
        ]);

    }

    public function boot(): void
    {
        $configurationLoader = $this->app->make(LaravelPanelConfigurationLoader::class);

        foreach ($configurationLoader->panels() as $id => $configuration) {
            $this->app->make(PanelManager::class)->register($id, $configuration);
        }

        $this->loadViewsFrom(__DIR__.'/../resources/views', 'admin-panel');
        $this->loadTranslationsFrom(
            __DIR__.'/../resources/lang',
            'admin-panel',
        );

        $this->app->booted(function (): void {
            if (! $this->app->routesAreCached()) {
                $this->app->make(AdminPanelRouteLoader::class)
                    ->load(base_path('routes/admin-panel.php'));
            }

            $this->loadRoutesFrom(__DIR__.'/../routes/web.php');
        });

        $this->publishes([
            __DIR__.'/../config/admin-panel.php' => config_path('admin-panel.php'),
        ], 'admin-panel-config');
        $this->publishes([
            __DIR__.'/../resources/lang' => lang_path('vendor/admin-panel'),
        ], 'admin-panel-translations');

        if ($this->app->runningInConsole()) {
            $this->commands([
                InstallAdminPanelCommand::class,
                MakeAdminResourceCommand::class,
            ]);
        }
    }
}
