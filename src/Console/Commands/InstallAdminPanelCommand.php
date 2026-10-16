<?php

namespace Parse\AdminPanel\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\ServiceProvider;
use Parse\AdminPanel\Authorization\PermissionManifest;
use Parse\AdminPanel\Infrastructure\Laravel\Panel\PanelManager;
use Parse\AdminPanel\Installation\AdminPanelInstaller;
use Spatie\Permission\PermissionRegistrar;

final class InstallAdminPanelCommand extends Command
{
    protected $signature = 'admin-panel:install
        {--force : Run database migrations in production without confirmation}';

    protected $description = 'Install Admin Panel configuration, migrations, and frontend integration';

    public function __construct(
        private readonly AdminPanelInstaller $installer,
    ) {
        parent::__construct();
    }

    public function handle(PanelManager $panels, PermissionManifest $manifest): int
    {
        if ($this->laravel->configurationIsCached()) {
            $this->components->error('Run php artisan config:clear before installing Admin Panel.');

            return self::FAILURE;
        }
        if ($this->hasLegacyPermissionSchema()) {
            $this->components->error('Existing permission tables do not support Teams. Add and run the Spatie Teams upgrade migration before rerunning installation.');

            return self::FAILURE;
        }

        $result = $this->installer->install(base_path());

        foreach ($result->completed as $message) {
            $this->components->info($message);
        }

        foreach ($result->unchanged as $message) {
            $this->components->bulletList([$message]);
        }

        foreach ($result->warnings as $message) {
            $this->components->warn($message);
        }

        $successful = $result->warnings === [];
        $teamsReady = $this->loadPermissionConfiguration($panels);
        if (! $teamsReady) {
            $successful = false;
        }
        $migrationsReady = $teamsReady && $this->publish('permission-migrations');
        if (! $migrationsReady) {
            $successful = false;
        }

        if ($migrationsReady && $this->commandExists('migrate')) {
            $exitCode = $this->call('migrate', ['--force' => (bool) $this->option('force')]);
            if ($exitCode !== self::SUCCESS) {
                $successful = false;
                $this->components->warn('Database migration did not complete; resolve the issue and rerun php artisan migrate.');
            } else {
                foreach ($panels->panels() as $panel) {
                    if (! $panel->authorizationEnabled) {
                        continue;
                    }
                    if (! is_file($manifest->path($panel)) && $this->call('admin-panel:generate', ['--panel' => $panel->id, '--only' => 'permissions']) !== self::SUCCESS) {
                        $successful = false;

                        continue;
                    }
                    if ($this->call('admin-panel:permissions-sync', ['--panel' => $panel->id]) !== self::SUCCESS) {
                        $successful = false;
                    }
                }
            }
        } else {
            $successful = false;
            $this->components->warn('Database migration was skipped because migration publishing failed or migrate is unavailable.');
        }

        if ($this->commandExists('wayfinder:generate')) {
            $exitCode = $this->call('wayfinder:generate', [
                '--with-form' => true,
                '--no-interaction' => true,
            ]);
            if ($exitCode !== self::SUCCESS) {
                $successful = false;
                $this->components->warn('Wayfinder route generation failed; rerun wayfinder:generate --with-form after resolving the error.');
            }
        } else {
            $successful = false;
            $this->components->warn('wayfinder:generate is not available; skipped route generation');
        }

        $this->newLine();
        if ($successful) {
            $this->components->info('Admin Panel installation files are ready.');
        } else {
            $this->components->warn('Admin Panel installation needs attention. Resolve the warnings above and rerun this command.');
        }
        $this->components->bulletList([
            'Run your package manager install (e.g. pnpm install) to fetch the added frontend dependencies',
            'Build frontend assets',
        ]);

        $this->components->info('To enable role management:');
        $this->components->bulletList([
            'Add Spatie HasRoles to the panel user model and explicitly configure its supported guards',
            'Authorization is enabled by default; set authorization.enabled to false only for panels that do not need it',
            'Teams are enabled by default; the default panel uses team_id=0 and super_admin_role=super-admin',
            'For tenant panels, set authorization.team_id to null and configure authorization.team_resolver before using the panel',
            'After adding resources, regenerate and sync permissions using admin-panel:generate --panel=<panel-id> and admin-panel:permissions-sync --panel=<panel-id>',
            'Grant access using admin-panel:super-admin --panel=<panel-id> --user=<existing-user-id>',
        ]);

        return $successful ? self::SUCCESS : self::FAILURE;
    }

    private function loadPermissionConfiguration(PanelManager $panels): bool
    {
        $path = config_path('permission.php');
        if (! is_file($path)) {
            $this->components->warn('Spatie Teams configuration is missing; migrations were skipped.');

            return false;
        }
        $configuration = require $path;
        if (! is_array($configuration) || ($configuration['teams'] ?? false) !== true) {
            $this->components->warn('Enable permission.teams before running migrations.');

            return false;
        }
        foreach ($panels->panels() as $panel) {
            if ($panel->authorizationEnabled && $panel->permissionTeamId === null && $panel->permissionTeamResolver === null) {
                $this->components->warn("Configure authorization.team_id or authorization.team_resolver for panel [{$panel->id}] before enabling Teams.");

                return false;
            }
        }
        config()->set('permission', $configuration);
        app(PermissionRegistrar::class)->initializeCache();

        return true;
    }

    private function hasLegacyPermissionSchema(): bool
    {
        if (config('permission.teams', false)) {
            return false;
        }
        $connection = DB::connection();
        if ($connection->getDriverName() === 'sqlite' && $connection->getDatabaseName() !== ':memory:'
            && ! is_file($connection->getDatabaseName())) {
            return false;
        }
        $schema = $connection->getSchemaBuilder();
        $roles = config('permission.table_names.roles', 'roles');

        return $schema->hasTable($roles)
            && ! $schema->hasColumn($roles, config('permission.column_names.team_foreign_key', 'team_id'));
    }

    private function publish(string $tag): bool
    {
        if (ServiceProvider::pathsToPublish(null, $tag) === []) {
            $this->components->warn("No publishable files found for [{$tag}]; check that its service provider is registered.");

            return false;
        }

        return $this->call('vendor:publish', [
            '--tag' => [$tag],
            '--no-interaction' => true,
        ]) === self::SUCCESS;
    }

    private function commandExists(string $name): bool
    {
        return array_key_exists($name, $this->getApplication()->all());
    }
}
