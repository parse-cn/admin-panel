<?php

namespace Parse\AdminPanel;

use Illuminate\Support\Facades\Facade;
use Parse\AdminPanel\Infrastructure\Laravel\Panel\PanelManager;

/**
 * @method static \Parse\AdminPanel\Infrastructure\Laravel\Panel\PanelRuntime panel(string $id)
 * @method static list<\Parse\AdminPanel\Infrastructure\Laravel\Panel\PanelRuntime> panels()
 * @method static \Parse\AdminPanel\Infrastructure\Laravel\Panel\PanelRuntime register(string $id, array<string, mixed> $configuration)
 *
 * @see PanelManager
 */
final class AdminPanel extends Facade
{
    protected static function getFacadeAccessor(): string
    {
        return PanelManager::class;
    }
}
