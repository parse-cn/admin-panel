<?php

namespace Parse\AdminPanel\Infrastructure\Laravel\Auth;

use Parse\AdminPanel\Infrastructure\Laravel\Panel\PanelRuntime;

final class LaravelPanelAuthConfigurator
{
    public function configure(PanelRuntime $panel): void
    {
        config()->set("auth.guards.{$panel->guard}", [
            'driver' => 'session',
            'provider' => $panel->provider,
        ]);
        config()->set("auth.providers.{$panel->provider}", [
            'driver' => 'eloquent',
            'model' => $panel->userModel,
        ]);
    }
}
