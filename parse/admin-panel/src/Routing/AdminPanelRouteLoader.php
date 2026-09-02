<?php

namespace Parse\AdminPanel\Routing;

final class AdminPanelRouteLoader
{
    public function load(string $path): void
    {
        if (is_file($path)) {
            require $path;
        }
    }
}
