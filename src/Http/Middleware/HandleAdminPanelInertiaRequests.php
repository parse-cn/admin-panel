<?php

namespace Parse\AdminPanel\Http\Middleware;

use Closure;
use Illuminate\Contracts\Container\Container;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Lang;
use Inertia\Inertia;
use Inertia\Middleware;
use Parse\AdminPanel\Infrastructure\Laravel\Panel\PanelManager;
use Parse\AdminPanel\Infrastructure\Laravel\Panel\SharesPanelProps;
use Parse\AdminPanel\Navigation\AdminPanelNavigation;
use Symfony\Component\HttpFoundation\Response;

final class HandleAdminPanelInertiaRequests extends Middleware
{
    protected $rootView = 'admin-panel::inertia';

    public function __construct(
        private readonly AdminPanelNavigation $navigation,
        private readonly PanelManager $panels,
        private readonly Container $container,
    ) {}

    public function handle(
        Request $request,
        Closure $next,
        string $panel = '',
    ): Response {
        $resolvedPanel = $this->panels->panel($panel);

        if ($resolvedPanel->domain !== null) {
            $this->withoutSsr[] = "*://{$resolvedPanel->domain}/*";
        }

        if ($resolvedPanel->prefix !== null) {
            $path = trim($resolvedPanel->prefix, '/');
            $this->withoutSsr = [...$this->withoutSsr, $path, "{$path}/*"];
        }

        return parent::handle($request, $next);
    }

    /**
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        if ($toast = $request->session()->get('toast')) {
            Inertia::flash('toast', $toast);
        }

        $panel = $this->panels->current($request);
        $administrator = $request->user($panel->guard);
        $panelProps = [];

        if ($panel->sharedProps !== null) {
            $provider = $this->container->make($panel->sharedProps);

            if ($provider instanceof SharesPanelProps) {
                $panelProps = $provider->share($request, $panel);
            }
        }
        $sharedPanel = is_array($panelProps['panel'] ?? null)
            ? $panelProps['panel']
            : [];

        return [
            ...parent::share($request),
            ...$panelProps,
            'panel' => [
                ...$sharedPanel,
                'brand' => array_merge(
                    $panel->brand ?? [],
                    is_array($sharedPanel['brand'] ?? null) ? $sharedPanel['brand'] : [],
                ),
                'id' => $panel->id,
                'appShell' => $panel->appShell,
                'theme' => $panel->theme,
                'timezone' => config('app.timezone', 'UTC'),
                'crudWidgetUrl' => route($panel->route('crud.widget.data'), [
                    'resource' => '__resource__',
                ]),
            ],
            'auth' => [
                'user' => $administrator ? [
                    'name' => data_get($administrator, 'name'),
                    'email' => data_get($administrator, 'email'),
                    'avatar' => data_get($administrator, 'avatar'),
                    'avatarPath' => method_exists($administrator, 'getRawOriginal')
                        ? $administrator->getRawOriginal('avatar')
                        : null,
                ] : null,
            ],
            'accountMenuUrls' => $panel->profileEnabled() ? [
                'profile' => route($panel->route('profile')),
                'preferences' => route($panel->route('profile.preferences')),
            ] : null,
            'navigation' => $this->navigation->for($request),
            'sidebarOpen' => $request->cookie('sidebar_state', 'true') === 'true',
            'i18n' => [
                'locale' => app()->currentLocale(),
                'fallbackLocale' => $panel->fallbackLocale,
                'supportedLocales' => collect($panel->supportedLocales)
                    ->map(fn (string $label, string $locale): array => [
                        'locale' => $locale,
                        'label' => $label,
                    ])
                    ->values()
                    ->all(),
                'messages' => Lang::get('admin-panel::messages'),
                'switchUrl' => route($panel->route('locale.update')),
            ],
        ];
    }
}
