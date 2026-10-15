<?php

namespace Parse\AdminPanel\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\ServiceProvider;
use Parse\AdminPanel\Authorization\Actions\InitializeRolePermissions;
use Parse\AdminPanel\Infrastructure\Laravel\Panel\PanelManager;
use Parse\AdminPanel\Installation\AdminPanelInstaller;

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

    public function handle(PanelManager $panels, InitializeRolePermissions $permissions): int
    {
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
        $migrationsReady = true;
        foreach (['permission-config', 'permission-migrations'] as $tag) {
            if (! $this->publish($tag)) {
                $successful = false;
                $migrationsReady = false;
            }
        }

        if ($migrationsReady && $this->commandExists('migrate')) {
            $exitCode = $this->call('migrate', ['--force' => (bool) $this->option('force')]);
            if ($exitCode !== self::SUCCESS) {
                $successful = false;
                $this->components->warn('Database migration did not complete; resolve the issue and rerun php artisan migrate.');
            } else {
                $guards = collect($panels->panels())
                    ->filter(fn ($panel): bool => $panel->authorizationEnabled)
                    ->pluck('guard')
                    ->unique();
                foreach ($guards as $guard) {
                    $permissions->handle($guard);
                    $this->components->info("Initialized the admin role and role-management permissions for guard [{$guard}].");
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
            'After configuring the user model, run admin-panel:permissions-init --panel=<panel-id> --user=<existing-user-id>',
        ]);

        return $successful ? self::SUCCESS : self::FAILURE;
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
