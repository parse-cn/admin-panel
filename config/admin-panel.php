<?php

use App\Models\User;

return [
    'middleware' => [
        'web',
    ],
    'vite' => [
        'entry' => 'resources/js/admin-panel.tsx',
    ],
    'app_shell' => 'default',
    'authorization' => [
        'policy_locations' => [],
    ],
    'localization' => [
        'default' => env('ADMIN_PANEL_LOCALE', config('app.locale', 'en')),
        'fallback' => env('ADMIN_PANEL_FALLBACK_LOCALE', config('app.fallback_locale', 'en')),
        'supported' => [
            'en' => 'English',
            'zh_CN' => '简体中文',
        ],
    ],
    'panels' => [
        'admin_panel' => [
            'domain' => env('ADMIN_PANEL_DOMAIN'),
            'prefix' => env('ADMIN_PANEL_PREFIX', 'admin'),
            'route_name' => 'admin_panel',
            'brand' => [
                'name' => config('app.name', 'Admin'),
                'logo' => null,
            ],
            'pagination' => [
                'per_page' => 10,
                'per_page_options' => [5, 10, 15, 25, 50],
            ],
            'authorization' => [
                'enabled' => true,
                // Project-relative path; null uses config/admin-panel-permissions.php. Use separate paths for multiple panels.
                'permissions_file' => null,
                'permissions' => [],
            ],
            'auth' => [
                'guard' => 'admin_panel',
                'provider' => 'users',
                'model' => User::class,
                'two_factor' => ['enabled' => true, 'required' => false],
            ],
        ],
    ],
];
