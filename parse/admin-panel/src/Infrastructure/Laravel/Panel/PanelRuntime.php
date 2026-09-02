<?php

namespace Parse\AdminPanel\Infrastructure\Laravel\Panel;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Parse\AdminPanel\Crud\Definition\CrudResourceRegistry;
use Parse\AdminPanel\Pages\AdminPanelDashboard;
use Parse\AdminPanel\Pages\AdminPanelPageRegistry;
use Parse\AdminPanel\Pages\RegisteredPage;
use Parse\AdminPanel\Resources\AdminPanelResource;
use Parse\AdminPanel\Resources\AdminPanelResourceRegistry;
use Parse\AdminPanel\Resources\RegisteredResource;
use Parse\AdminPanel\Uploads\AdminPanelUploadRegistry;
use Parse\AdminPanel\Uploads\RegisteredUpload;

final readonly class PanelRuntime
{
    /**
     * @param  list<string>  $middleware
     * @param  class-string<Model>  $userModel
     * @param  class-string<SharesPanelProps>|null  $sharedProps
     * @param  array<string, string>  $supportedLocales
     * @param  array<string, string>  $theme
     * @param  array{favicon: string|null, logo: string|null, name: string}|null  $brand
     * @param  array{enabled: bool, avatar_upload: array{purpose: string, disk: string, directory: callable(Request): string, rules: list<mixed>}|null}  $profile
     * @param  array{label: string, icon: string, group: string, groupSort: int, section: string, sectionSort: int, sort: int, activeRoutes: list<string>}|null  $dashboardNavigation
     */
    public function __construct(
        public string $id,
        public ?string $domain,
        public ?string $prefix,
        public string $routeName,
        public array $middleware,
        public string $guard,
        public string $provider,
        public string $userModel,
        public ?string $activeStatus,
        public string $loginComponent,
        public ?string $sharedProps,
        public string $appShell,
        public array $theme,
        public ?array $brand,
        public array $profile,
        public ?array $dashboardNavigation,
        public string $defaultLocale,
        public string $fallbackLocale,
        public array $supportedLocales,
        public int $perPage,
        public array $perPageOptions,
        private CrudResourceRegistry $crudResources,
        private AdminPanelResourceRegistry $resources,
        private AdminPanelPageRegistry $pages,
        private AdminPanelDashboard $dashboard,
        private AdminPanelUploadRegistry $uploads,
    ) {}

    /**
     * @param  class-string<AdminPanelResource>  $resource
     * @param  list<string>|null  $only
     * @param  list<string>  $except
     */
    public function resource(
        string $uri,
        string $resource,
        ?array $only = null,
        array $except = [],
    ): void {
        $this->resources->resource($uri, $resource, $only, $except);
    }

    /**
     * @return list<RegisteredResource>
     */
    public function resources(): array
    {
        return $this->resources->resources();
    }

    /**
     * Register a CRUD resource for use as an embedded widget.
     *
     * @param  class-string<AdminPanelResource>  $resource
     * @param  list<string>|null  $only
     * @param  list<string>  $except
     */
    public function widget(
        string $resource,
        ?array $only = null,
        array $except = [],
    ): void {
        if (! str_starts_with($resource::routeName(), "{$this->routeName}.")) {
            throw new \InvalidArgumentException(
                "Widget resource [{$resource}] route name must start with [{$this->routeName}.].",
            );
        }

        $this->crudResources->registerWidget($resource, $only, $except);
    }

    /**
     * @param  class-string|array{class-string, non-empty-string}  $action
     * @param  array{
     *     label: string,
     *     icon: string,
     *     group?: string,
     *     groupSort?: int,
     *     section?: string,
     *     sectionSort?: int,
     *     badge?: string,
     *     sort?: int
     * }|null  $navigation
     */
    public function page(
        string $uri,
        string $name,
        string|array $action,
        ?array $navigation = null,
    ): void {
        $this->pages->page($uri, $name, $action, $navigation);
    }

    /**
     * @return list<RegisteredPage>
     */
    public function pages(): array
    {
        return $this->pages->pages();
    }

    /**
     * @param  class-string|array{class-string, non-empty-string}  $action
     */
    public function dashboard(string|array $action, string $uri = ''): void
    {
        $this->dashboard->replace($action, $uri);
    }

    /**
     * @return class-string|array{class-string, non-empty-string}
     */
    public function dashboardAction(): string|array
    {
        return $this->dashboard->action();
    }

    public function dashboardUri(): string
    {
        return $this->dashboard->uri();
    }

    /**
     * @param  callable(): void  $routes
     */
    public function routes(callable $routes): void
    {
        $this->pages->routes($routes);
    }

    /**
     * @return list<callable(): void>
     */
    public function registeredRoutes(): array
    {
        return $this->pages->registeredRoutes();
    }

    public function route(string $name): string
    {
        return "{$this->routeName}.{$name}";
    }

    public function localeCookieName(): string
    {
        return "admin_panel_{$this->id}_locale";
    }

    /**
     * @param  callable(Request): string  $directory
     * @param  list<mixed>  $rules
     */
    public function upload(
        string $purpose,
        string $disk,
        callable $directory,
        array $rules,
    ): void {
        $this->uploads->register($purpose, $disk, $directory, $rules);
    }

    /**
     * Register an image upload with the panel's standard image validation.
     *
     * @param  string|callable(Request): string  $directory
     * @param  list<mixed>|null  $rules
     */
    public function imageUpload(
        string $purpose,
        string|callable $directory,
        string $disk = 'public',
        ?array $rules = null,
    ): void {
        $directoryCallback = is_string($directory)
            ? static fn (Request $request): string => $directory
            : $directory;

        $this->upload(
            purpose: $purpose,
            disk: $disk,
            directory: $directoryCallback,
            rules: $rules ?? ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
        );
    }

    public function registeredUpload(string $purpose): RegisteredUpload
    {
        return $this->uploads->get($purpose);
    }

    public function hasUpload(string $purpose): bool
    {
        return $this->uploads->has($purpose);
    }

    public function profileEnabled(): bool
    {
        return $this->profile['enabled'];
    }

    /** @return array{purpose: string, disk: string, directory: callable(Request): string, rules: list<mixed>}|null */
    public function profileAvatarUpload(): ?array
    {
        return $this->profile['avatar_upload'];
    }
}
