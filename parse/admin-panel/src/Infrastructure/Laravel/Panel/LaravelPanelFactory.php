<?php

namespace Parse\AdminPanel\Infrastructure\Laravel\Panel;

use Illuminate\Database\Eloquent\Model;
use InvalidArgumentException;
use Parse\AdminPanel\Crud\Definition\CrudResourceRegistry;
use Parse\AdminPanel\Domain\Panel\PanelDefinition;
use Parse\AdminPanel\Domain\Panel\PanelRegistry;
use Parse\AdminPanel\Http\Controllers\DashboardController;
use Parse\AdminPanel\Infrastructure\Laravel\Auth\LaravelPanelAuthConfigurator;
use Parse\AdminPanel\Pages\AdminPanelDashboard;
use Parse\AdminPanel\Pages\AdminPanelPageRegistry;
use Parse\AdminPanel\Resources\AdminPanelResourceRegistry;
use Parse\AdminPanel\Uploads\AdminPanelUploadRegistry;

final class LaravelPanelFactory
{
    public function __construct(
        private readonly PanelRegistry $panels,
        private readonly PanelRuntimeRegistry $runtimePanels,
        private readonly LaravelPanelAuthConfigurator $authConfigurator,
        private readonly CrudResourceRegistry $crudResources,
    ) {}

    /**
     * @param  array<string, mixed>  $configuration
     */
    public function create(string $id, array $configuration): PanelRuntime
    {
        $routeName = $this->string($configuration, 'route_name', $id);
        $guard = $this->string($configuration, 'auth.guard', $id);
        $provider = $this->string($configuration, 'auth.provider', "{$id}_users");
        $userModel = $this->string($configuration, 'auth.model');
        $sharedProps = $this->nullableString($configuration, 'shared_props');
        $appShell = $this->appShell($configuration);
        $theme = $this->theme($configuration);
        $brand = $this->brand($configuration);
        $profile = $this->profile($configuration);
        $defaultLocale = $this->string(
            $configuration,
            'localization.default',
            config('admin-panel.localization.default', config('app.locale', 'en')),
        );
        $fallbackLocale = $this->string(
            $configuration,
            'localization.fallback',
            config('admin-panel.localization.fallback', config('app.fallback_locale', 'en')),
        );
        $supportedLocales = $this->supportedLocales($configuration);
        $perPage = $this->positiveInteger($configuration, 'pagination.per_page', 10);
        $perPageOptions = $this->positiveIntegers(
            $configuration,
            'pagination.per_page_options',
            [5, 10, 15, 25, 50],
        );

        if (! array_key_exists($defaultLocale, $supportedLocales)) {
            throw new InvalidArgumentException(
                "Admin panel [{$id}] default locale [{$defaultLocale}] must be supported.",
            );
        }

        if (! is_subclass_of($userModel, Model::class)) {
            throw new InvalidArgumentException(
                "Admin panel [{$id}] user model must extend ".Model::class.'.',
            );
        }

        if ($sharedProps !== null && ! is_subclass_of($sharedProps, SharesPanelProps::class)) {
            throw new InvalidArgumentException(
                "Admin panel [{$id}] shared props provider must implement ".SharesPanelProps::class.'.',
            );
        }

        $panel = new PanelRuntime(
            id: $id,
            domain: $this->nullableString($configuration, 'domain'),
            prefix: $this->nullableString($configuration, 'prefix'),
            routeName: $routeName,
            middleware: $this->middleware($configuration),
            guard: $guard,
            provider: $provider,
            userModel: $userModel,
            activeStatus: $this->nullableString($configuration, 'auth.status'),
            loginComponent: $this->string($configuration, 'login_component', 'login'),
            sharedProps: $sharedProps,
            appShell: $appShell,
            theme: $theme,
            brand: $brand,
            profile: $profile,
            dashboardNavigation: $this->dashboardNavigation($configuration),
            defaultLocale: $defaultLocale,
            fallbackLocale: $fallbackLocale,
            supportedLocales: $supportedLocales,
            perPage: $perPage,
            perPageOptions: $perPageOptions,
            crudResources: $this->crudResources,
            resources: new AdminPanelResourceRegistry($routeName),
            pages: new AdminPanelPageRegistry,
            dashboard: new AdminPanelDashboard(DashboardController::class),
            uploads: new AdminPanelUploadRegistry,
        );
        $panel->imageUpload(
            purpose: 'image',
            directory: "admin-panel/{$id}/images",
        );

        if ($profile['enabled'] && $profile['avatar_upload'] !== null) {
            $panel->imageUpload(
                purpose: $profile['avatar_upload']['purpose'],
                directory: $profile['avatar_upload']['directory'],
                disk: $profile['avatar_upload']['disk'],
                rules: $profile['avatar_upload']['rules'],
            );
        }

        $this->authConfigurator->configure($panel);

        $this->panels->register(new PanelDefinition(
            id: $panel->id,
            domain: $panel->domain,
            prefix: $panel->prefix,
        ));

        return $this->runtimePanels->register($panel);
    }

    /**
     * @param  array<string, mixed>  $configuration
     * @return array{label: string, icon: string, group: string, groupSort: int, section: string, sectionSort: int, sort: int, activeRoutes: list<string>}|null
     */
    private function dashboardNavigation(array $configuration): ?array
    {
        $navigation = data_get($configuration, 'navigation.dashboard');

        if (! is_array($navigation)) {
            return null;
        }

        return [
            'label' => (string) ($navigation['label'] ?? 'admin-panel::messages.dashboard.title'),
            'icon' => (string) ($navigation['icon'] ?? 'dashboard-line'),
            'group' => (string) ($navigation['group'] ?? 'admin-panel::messages.navigation.workspace'),
            'groupSort' => (int) ($navigation['groupSort'] ?? 0),
            'section' => (string) ($navigation['section'] ?? 'admin-panel::messages.navigation.workspace'),
            'sectionSort' => (int) ($navigation['sectionSort'] ?? 0),
            'sort' => (int) ($navigation['sort'] ?? 0),
            'activeRoutes' => array_values(array_filter($navigation['activeRoutes'] ?? [], 'is_string')),
        ];
    }

    /**
     * @param  array<string, mixed>  $configuration
     */
    private function string(
        array $configuration,
        string $key,
        ?string $default = null,
    ): string {
        $value = data_get($configuration, $key, $default);

        if (! is_string($value) || $value === '') {
            throw new InvalidArgumentException("Admin panel configuration [{$key}] must be a non-empty string.");
        }

        return $value;
    }

    /**
     * @param  array<string, mixed>  $configuration
     */
    private function nullableString(array $configuration, string $key): ?string
    {
        $value = data_get($configuration, $key);

        return is_string($value) && $value !== '' ? $value : null;
    }

    /**
     * @param  array<string, mixed>  $configuration
     */
    private function appShell(array $configuration): string
    {
        $appShell = data_get(
            $configuration,
            'app_shell',
            config('admin-panel.app_shell', 'default'),
        );

        if (! is_string($appShell) || ! in_array($appShell, ['default', 'app-shell-2', 'app-shell-3'], true)) {
            throw new InvalidArgumentException(
                'Admin panel configuration [app_shell] must be one of [default], [app-shell-2], or [app-shell-3].',
            );
        }

        return $appShell;
    }

    /**
     * @param  array<string, mixed>  $configuration
     * @return array{enabled: bool, avatar_upload: array{purpose: string, disk: string, directory: callable(Request): string, rules: list<mixed>}|null}
     */
    private function profile(array $configuration): array
    {
        $profile = $configuration['profile'] ?? [];

        if ($profile === false) {
            return ['enabled' => false, 'avatar_upload' => null];
        }

        if (! is_array($profile)) {
            throw new InvalidArgumentException('Admin panel configuration [profile] must be an array or false.');
        }

        $enabled = $profile['enabled'] ?? true;
        if (! is_bool($enabled)) {
            throw new InvalidArgumentException('Admin panel configuration [profile.enabled] must be boolean.');
        }

        $avatarDirectory = $profile['avatar'] ?? null;

        if ($avatarDirectory === null) {
            return ['enabled' => $enabled, 'avatar_upload' => null];
        }

        if (! is_string($avatarDirectory) && ! is_callable($avatarDirectory)) {
            throw new InvalidArgumentException(
                'Admin panel configuration [profile.avatar] must be a directory string or callable.',
            );
        }

        return [
            'enabled' => $enabled,
            'avatar_upload' => [
                'purpose' => 'profile-avatar',
                'disk' => 'public',
                'directory' => is_string($avatarDirectory)
                    ? static function (Request $request) use ($avatarDirectory): string {
                        return $avatarDirectory;
                    }
                    : $avatarDirectory,
                'rules' => ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
            ],
        ];
    }

    /**
     * @param  array<string, mixed>  $configuration
     * @return array<string, string>
     */
    private function theme(array $configuration): array
    {
        $theme = data_get($configuration, 'theme', []);

        if (! is_array($theme)) {
            throw new InvalidArgumentException(
                'Admin panel configuration [theme] must be an array.',
            );
        }

        $resolvedTheme = [];

        foreach ($theme as $name => $value) {
            if (
                ! is_string($name)
                || ! preg_match('/^[a-z][a-z0-9_-]*$/', $name)
                || ! is_string($value)
                || trim($value) === ''
                || strpbrk($value, ';{}') !== false
            ) {
                throw new InvalidArgumentException(
                    'Admin panel theme tokens must use safe names and non-empty CSS values.',
                );
            }

            $resolvedTheme[$name] = trim($value);
        }

        return $resolvedTheme;
    }

    /**
     * @param  array<string, mixed>  $configuration
     * @return array{favicon: string|null, logo: string|null, name: string}|null
     */
    private function brand(array $configuration): ?array
    {
        $brand = data_get($configuration, 'brand');

        if ($brand === null) {
            return null;
        }

        if (! is_array($brand)) {
            throw new InvalidArgumentException('Admin panel configuration [brand] must be an array.');
        }

        $name = data_get($brand, 'name');

        if (! is_string($name) || trim($name) === '') {
            throw new InvalidArgumentException('Admin panel configuration [brand.name] must be a non-empty string.');
        }

        $logo = data_get($brand, 'logo');

        $favicon = data_get($brand, 'favicon');

        if ($logo !== null && (! is_string($logo) || trim($logo) === '')) {
            throw new InvalidArgumentException('Admin panel configuration [brand.logo] must be a non-empty string or null.');
        }

        if ($favicon !== null && (! is_string($favicon) || trim($favicon) === '')) {
            throw new InvalidArgumentException('Admin panel configuration [brand.favicon] must be a non-empty string or null.');
        }

        return [
            'favicon' => is_string($favicon) ? trim($favicon) : null,
            'logo' => is_string($logo) ? trim($logo) : null,
            'name' => trim($name),
        ];
    }

    /**
     * @param  array<string, mixed>  $configuration
     * @return list<string>
     */
    private function middleware(array $configuration): array
    {
        $middleware = data_get(
            $configuration,
            'middleware',
            config('admin-panel.middleware', ['web']),
        );

        if (! is_array($middleware)) {
            return ['web'];
        }

        $resolvedMiddleware = array_values(array_filter(
            $middleware,
            static fn (mixed $value): bool => is_string($value) && $value !== '',
        ));

        return $resolvedMiddleware !== [] ? $resolvedMiddleware : ['web'];
    }

    /**
     * @param  array<string, mixed>  $configuration
     * @return array<string, string>
     */
    private function supportedLocales(array $configuration): array
    {
        $configuredLocales = data_get(
            $configuration,
            'localization.supported',
            config('admin-panel.localization.supported', ['en' => 'English']),
        );

        if (! is_array($configuredLocales)) {
            throw new InvalidArgumentException(
                'Admin panel configuration [localization.supported] must be an array.',
            );
        }

        $supportedLocales = [];

        foreach ($configuredLocales as $locale => $label) {
            if (! is_string($locale) || $locale === '' || ! is_string($label) || $label === '') {
                throw new InvalidArgumentException(
                    'Admin panel supported locales must use non-empty locale keys and labels.',
                );
            }

            $supportedLocales[$locale] = $label;
        }

        if ($supportedLocales === []) {
            throw new InvalidArgumentException(
                'Admin panel configuration [localization.supported] must not be empty.',
            );
        }

        return $supportedLocales;
    }

    /**
     * @param  array<string, mixed>  $configuration
     */
    private function positiveInteger(
        array $configuration,
        string $key,
        int $default,
    ): int {
        $value = data_get($configuration, $key, $default);

        if (! is_int($value) || $value < 1) {
            throw new InvalidArgumentException(
                "Admin panel configuration [{$key}] must be a positive integer.",
            );
        }

        return $value;
    }

    /**
     * @param  array<string, mixed>  $configuration
     * @param  list<int>  $default
     * @return list<int>
     */
    private function positiveIntegers(
        array $configuration,
        string $key,
        array $default,
    ): array {
        $values = data_get($configuration, $key, $default);

        if (! is_array($values)) {
            throw new InvalidArgumentException(
                "Admin panel configuration [{$key}] must be an array.",
            );
        }

        $resolved = array_values(array_unique(array_filter(
            $values,
            static fn (mixed $value): bool => is_int($value) && $value > 0,
        )));

        if ($resolved === []) {
            throw new InvalidArgumentException(
                "Admin panel configuration [{$key}] must contain a positive integer.",
            );
        }

        return $resolved;
    }
}
