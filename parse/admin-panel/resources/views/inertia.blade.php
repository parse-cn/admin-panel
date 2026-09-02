<!doctype html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    @php
        $panel = app(\Parse\AdminPanel\Infrastructure\Laravel\Panel\PanelManager::class)->current(request());
        $favicon = data_get($panel->brand, 'favicon', '/favicon.svg');
    @endphp
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="icon" href="{{ $favicon }}">
    <title>{{ config('app.name', 'Admin Panel') }}</title>
    @viteReactRefresh
    @vite(config('admin-panel.vite.entry'))
    @inertiaHead
</head>
<body>
@inertia
</body>
</html>
