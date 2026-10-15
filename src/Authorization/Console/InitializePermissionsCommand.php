<?php

namespace Parse\AdminPanel\Authorization\Console;

use Illuminate\Console\Command;
use Parse\AdminPanel\Authorization\Actions\InitializeRolePermissions;
use Parse\AdminPanel\Infrastructure\Laravel\Panel\PanelManager;
use Spatie\Permission\Guard;
use Spatie\Permission\Traits\HasRoles;

final class InitializePermissionsCommand extends Command
{
    protected $signature = 'admin-panel:permissions-init {--panel= : Panel ID} {--user= : Existing user primary key} {--role=admin : Administrator role name}';

    protected $description = 'Initialize role-management permissions and grant them to an existing user.';

    public function handle(PanelManager $panels, InitializeRolePermissions $permissions): int
    {
        $panelId = $this->option('panel');
        if (! is_string($panelId) || $panelId === '' || $this->option('user') === null) {
            $this->error('Both --panel and --user are required.');

            return self::INVALID;
        }
        $panel = $panels->panel($panelId);
        if (! $panel->authorizationEnabled) {
            $this->error('Enable authorization for this panel first.');

            return self::INVALID;
        }
        if (! in_array(HasRoles::class, class_uses_recursive($panel->userModel), true)) {
            $this->error('The panel user model must use Spatie HasRoles.');

            return self::INVALID;
        }
        $user = $panel->userModel::query()->findOrFail($this->option('user'));
        if (! Guard::getNames($user)->contains($panel->guard)) {
            $this->error('The user model must explicitly support the panel guard.');

            return self::INVALID;
        }
        $name = trim((string) $this->option('role'));
        if ($name === '' || mb_strlen($name) > 255) {
            $this->error('Role name must contain between 1 and 255 characters.');

            return self::INVALID;
        }
        $user->getConnection()->transaction(function () use ($panel, $user, $name, $permissions): void {
            $user->assignRole($permissions->handle($panel->guard, $name));
        });
        $this->info('Role-management permissions initialized and role assigned.');

        return self::SUCCESS;
    }
}
