<?php

namespace Parse\AdminPanel\Authorization\Console;

use Illuminate\Console\Command;
use InvalidArgumentException;
use Parse\AdminPanel\Authorization\PanelTeams;
use Parse\AdminPanel\Infrastructure\Laravel\Panel\PanelManager;
use Spatie\Permission\Guard;
use Spatie\Permission\Traits\HasRoles;

final class SuperAdminCommand extends Command
{
    protected $signature = 'admin-panel:super-admin
        {--panel= : Panel ID}
        {--user= : Existing user primary key}
        {--team-id= : Permission team ID}
        {--revoke : Revoke the super administrator role}';

    protected $description = 'Grant or revoke the configured panel super administrator role.';

    public function handle(PanelManager $panels, PanelTeams $teams): int
    {
        try {
            $id = $this->option('panel');
            if (! is_string($id) || $id === '' || $this->option('user') === null) {
                throw new InvalidArgumentException('Both --panel and --user are required.');
            }
            $panel = $panels->panel($id);
            if (! $panel->authorizationEnabled || $panel->superAdminRole === null) {
                throw new InvalidArgumentException('Configure authorization.super_admin_role for this panel first.');
            }
            if (! in_array(HasRoles::class, class_uses_recursive($panel->userModel), true)) {
                throw new InvalidArgumentException('The panel user model must use Spatie HasRoles.');
            }
            $user = $panel->userModel::query()->find($this->option('user'));
            if ($user === null || ! Guard::getNames($user)->contains($panel->guard)) {
                throw new InvalidArgumentException('An existing user supporting the panel guard is required.');
            }
            $teamId = $teams->resolve($panel, $user, $this->option('team-id'));
            $teams->run($teamId, function () use ($user, $panel, $teams): void {
                $user->unsetRelation('roles')->unsetRelation('permissions');
                try {
                    $user->getConnection()->transaction(function () use ($user, $panel, $teams): void {
                        $role = $teams->roles($panel)->where('name', $panel->superAdminRole)->first();
                        if ($this->option('revoke')) {
                            if ($role !== null) {
                                $user->removeRole($role);
                            }

                            return;
                        }
                        if ($role === null) {
                            $model = config('permission.models.role');
                            $role = new $model;
                            $role->fill(['name' => $panel->superAdminRole, 'guard_name' => $panel->guard]);
                            if ($teams->enabled()) {
                                $role->setAttribute($teams->key(), $teams->current());
                            }
                            $role->save();
                        }
                        $user->assignRole($role);
                    });
                } finally {
                    $user->unsetRelation('roles')->unsetRelation('permissions');
                }
            });
        } catch (InvalidArgumentException $exception) {
            $this->error($exception->getMessage());

            return self::INVALID;
        }
        $this->info($this->option('revoke') ? 'Super administrator role revoked.' : 'Super administrator role granted.');

        return self::SUCCESS;
    }
}
