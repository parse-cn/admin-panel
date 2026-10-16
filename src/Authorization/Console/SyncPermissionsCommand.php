<?php

namespace Parse\AdminPanel\Authorization\Console;

use Illuminate\Console\Command;
use Illuminate\Database\Eloquent\Model;
use InvalidArgumentException;
use Parse\AdminPanel\Authorization\PanelTeams;
use Parse\AdminPanel\Authorization\PermissionManifest;
use Parse\AdminPanel\Infrastructure\Laravel\Panel\PanelManager;
use RuntimeException;
use Spatie\Permission\PermissionRegistrar;
use Throwable;

final class SyncPermissionsCommand extends Command
{
    protected $signature = 'admin-panel:permissions-sync
        {--panel=admin_panel : Panel ID}
        {--dry-run : Preview without changing database records}
        {--assign-role= : Append manifest permissions to an existing role in the panel guard}
        {--team-id= : Permission team ID for role assignment}';

    protected $description = 'Synchronize database permissions from the deployed permission manifest';

    public function handle(PanelManager $panels, PermissionManifest $manifest): int
    {
        $teams = app(PanelTeams::class);
        try {
            $teamId = null;
            if ($this->option('assign-role') !== null || $this->option('team-id') !== null) {
                $panelId = $this->option('panel');
                if (! is_string($panelId) || $panelId === '') {
                    throw new InvalidArgumentException('--panel is required.');
                }
                $teamId = $teams->resolve($panels->panel($panelId), explicit: $this->option('team-id'));
            }

            return $teams->run($teamId, fn (): int => $this->synchronize($panels, $manifest));
        } catch (InvalidArgumentException $exception) {
            $this->error($exception->getMessage());

            return self::INVALID;
        }
    }

    private function synchronize(PanelManager $panels, PermissionManifest $manifest): int
    {
        try {
            $id = $this->option('panel');
            if (! is_string($id) || $id === '') {
                throw new InvalidArgumentException('--panel is required.');
            }
            $panel = $panels->panel($id);
            if (! $panel->authorizationEnabled) {
                throw new InvalidArgumentException('Authorization is disabled for this panel.');
            }
            $names = $manifest->read($panel);
            $permissionModel = config('permission.models.permission');
            $permission = new $permissionModel;
            if (! $permission instanceof Model) {
                throw new InvalidArgumentException('The configured permission model must extend Eloquent Model.');
            }
            $role = $this->option('assign-role') === null ? null : app(PanelTeams::class)->roles($panel)->where('name', $this->option('assign-role'))->first();
            if ($this->option('assign-role') !== null && $role === null) {
                throw new InvalidArgumentException('The requested role does not exist in this panel guard.');
            }
            $existing = $permissionModel::query()->where('guard_name', $panel->guard)->pluck('name')->all();
        } catch (InvalidArgumentException $exception) {
            $this->error($exception->getMessage());

            return self::INVALID;
        }
        foreach (array_diff($existing, $names) as $name) {
            $this->warn('Existing permission absent from this panel manifest (preserved): '.$name);
        }
        if ($this->option('dry-run')) {
            foreach ($names as $name) {
                $this->line((in_array($name, $existing, true) ? '[Exists] ' : '[Will create] ').$name);
            }
            $this->info('Preview complete; no database records were changed.');

            return self::SUCCESS;
        }
        // findOrCreate() reads Spatie's cache, which may outlive a database restore or reset.
        app(PermissionRegistrar::class)->forgetCachedPermissions();
        try {
            $statuses = $permission->getConnection()->transaction(function () use ($permissionModel, $names, $panel, $role): array {
                $permissions = [];
                $statuses = [];
                foreach ($names as $name) {
                    $record = $permissionModel::findOrCreate($name, $panel->guard);
                    if (! $permissionModel::query()->whereKey($record->getKey())
                        ->where('name', $name)->where('guard_name', $panel->guard)->exists()) {
                        throw new RuntimeException('Permission was not persisted: '.$name);
                    }
                    $statuses[$name] = $record->wasRecentlyCreated ? 'Created' : 'Exists';
                    $permissions[] = $record;
                }
                if ($permissions !== []) {
                    $role?->givePermissionTo($permissions);
                }

                return $statuses;
            });
        } catch (Throwable $exception) {
            $this->error('[Failed] '.$exception->getMessage());
            $this->error('Synchronization rolled back; no changes from this run were committed.');

            return self::FAILURE;
        } finally {
            app(PermissionRegistrar::class)->forgetCachedPermissions();
        }
        foreach ($statuses as $name => $status) {
            $this->line('['.$status.'] '.$name);
        }
        $created = count(array_filter($statuses, fn (string $status): bool => $status === 'Created'));
        $this->info('Guard ['.$panel->guard.']: '.$created.' created, '.(count($statuses) - $created).' already exist, 0 failed.');

        return self::SUCCESS;
    }
}
