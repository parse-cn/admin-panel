<?php

namespace Parse\AdminPanel\Console\Commands;

use Illuminate\Console\Command;
use Parse\AdminPanel\Installation\AdminPanelInstaller;

final class InstallAdminPanelCommand extends Command
{
    protected $signature = 'admin-panel:install';

    protected $description = 'Install the Admin Panel frontend integration and configuration';

    public function __construct(
        private readonly AdminPanelInstaller $installer,
    ) {
        parent::__construct();
    }

    public function handle(): int
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

        $this->call('wayfinder:generate', [
            '--with-form' => true,
            '--no-interaction' => true,
        ]);

        $this->newLine();
        $this->components->info('Admin Panel installation is ready.');
        $this->components->bulletList([
            'Install Node dependencies with your package manager',
            'Run php artisan migrate',
            'Build frontend assets',
        ]);

        return $result->warnings === [] ? self::SUCCESS : self::FAILURE;
    }
}
