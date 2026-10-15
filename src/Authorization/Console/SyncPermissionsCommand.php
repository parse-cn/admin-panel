<?php

namespace Parse\AdminPanel\Authorization\Console;

use Illuminate\Console\Command;
use Illuminate\Database\Eloquent\Model;
use InvalidArgumentException;
use Parse\AdminPanel\Authorization\PermissionManifest;
use Parse\AdminPanel\Infrastructure\Laravel\Panel\PanelManager;
use Spatie\Permission\PermissionRegistrar;

final class SyncPermissionsCommand extends Command
{
    protected $signature = 'admin-panel:permissions-sync
        {--panel= : Panel ID}
        {--dry-run : Preview without changing database records}
        {--assign-role= : Append manifest permissions to an existing role in the panel guard}';

    protected $description = 'Synchronize database permissions from the deployed permission manifest';

    public function handle(PanelManager $panels, PermissionManifest $manifest): int
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
            $roleModel = config('permission.models.role');
            $role = $this->option('assign-role') === null ? null : $roleModel::query()
                ->where('guard_name', $panel->guard)->where('name', $this->option('assign-role'))->first();
            if ($this->option('assign-role') !== null && $role === null) {
                throw new InvalidArgumentException('The requested role does not exist in this panel guard.');
            }
            $existing = $permissionModel::query()->where('guard_name', $panel->guard)->pluck('name')->all();
        } catch (InvalidArgumentException $exception) {
            $this->error($exception->getMessage());

            return self::INVALID;
        }
        foreach (array_diff($names, $existing) as $name) {
            $this->line('Missing: '.$name);
        }
        foreach (array_diff($existing, $names) as $name) {
            $this->warn('Existing permission absent from this panel manifest (preserved): '.$name);
        }
        if ($this->option('dry-run')) {
            $this->info('Preview complete; no database records were changed.');

            return self::SUCCESS;
        }
        $permission->getConnection()->transaction(function () use ($permissionModel, $names, $panel, $role): void {
            $permissions = [];
            foreach ($names as $name) {
                $permissions[] = $permissionModel::findOrCreate($name, $panel->guard);
            }
            if ($permissions !== []) {
                $role?->givePermissionTo($permissions);
            }
        });
        app(PermissionRegistrar::class)->forgetCachedPermissions();
        $this->info(count($names).' permissions synchronized for guard ['.$panel->guard.']. Existing IDs and role assignments were preserved.');

        return self::SUCCESS;
    }
}
