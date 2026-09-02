<?php

namespace Parse\AdminPanel\Navigation;

use Illuminate\Http\Request;
use Parse\AdminPanel\Infrastructure\Laravel\Panel\PanelManager;
use Parse\AdminPanel\Pages\RegisteredPage;
use Parse\AdminPanel\Resources\RegisteredResource;

final class AdminPanelNavigation
{
    public function __construct(
        private readonly PanelManager $panels,
    ) {}

    /**
     * @return array{
     *     dashboard: string,
     *     logout: string,
     *     globalSearch: array{url: string, minimumQueryLength: int},
     *     labels: array<string, string>,
     *     groups: list<array{
     *         label: string,
     *         section: string,
     *         sectionSort: int,
     *         items: list<array{
     *             label: string,
     *             href: string,
     *             icon: string,
     *             badge: string|null,
     *             active: bool
     *         }>
     *     }>
     * }
     */
    public function for(Request $request): array
    {
        $panel = $this->panels->current($request);
        $resourceItems = collect($panel->resources())
            ->map(function (RegisteredResource $registration) use ($request): ?array {
                $user = $registration->resource::user($request);

                if (
                    $user === null
                    || ! $registration->resource::authorize('viewAny', $user)
                ) {
                    return null;
                }

                $navigation = $registration->resource::navigation();

                if ($navigation === null || ($navigation['hidden'] ?? false) === true) {
                    return null;
                }

                return [
                    'group' => isset($navigation['group'])
                        ? __($navigation['group'])
                        : __('admin-panel::messages.navigation.resources'),
                    'groupSort' => $navigation['groupSort'] ?? 10,
                    'section' => isset($navigation['section'])
                        ? __($navigation['section'])
                        : __('admin-panel::messages.navigation.workspace'),
                    'sectionSort' => $navigation['sectionSort'] ?? 0,
                    'sort' => $navigation['sort'] ?? 0,
                    'item' => [
                        'label' => __($navigation['label']),
                        'href' => route($registration->resource::routeName()),
                        'icon' => $navigation['icon'],
                        'badge' => isset($navigation['badge']) ? __($navigation['badge']) : null,
                        'active' => $this->isActive($request, $registration->resource::routeName(), $navigation),
                    ],
                ];
            })
            ->filter();
        $pageItems = collect($panel->pages())
            ->map(function (RegisteredPage $page) use ($panel, $request): ?array {
                if ($page->navigation === null) {
                    return null;
                }

                $routeName = $panel->route($page->name);

                return [
                    'group' => isset($page->navigation['group'])
                        ? __($page->navigation['group'])
                        : __('admin-panel::messages.navigation.pages'),
                    'groupSort' => $page->navigation['groupSort'] ?? 10,
                    'section' => isset($page->navigation['section'])
                        ? __($page->navigation['section'])
                        : __('admin-panel::messages.navigation.workspace'),
                    'sectionSort' => $page->navigation['sectionSort'] ?? 0,
                    'sort' => $page->navigation['sort'] ?? 0,
                    'item' => [
                        'label' => __($page->navigation['label']),
                        'href' => route($routeName),
                        'icon' => $page->navigation['icon'],
                        'badge' => isset($page->navigation['badge']) ? __($page->navigation['badge']) : null,
                        'active' => $this->isActive($request, $routeName, $page->navigation),
                    ],
                ];
            })
            ->filter();
        $dashboardNavigation = $panel->dashboardNavigation ?? [
            'label' => 'admin-panel::messages.dashboard.title',
            'icon' => 'dashboard-line',
            'group' => 'admin-panel::messages.navigation.workspace',
            'groupSort' => 0,
            'section' => 'admin-panel::messages.navigation.workspace',
            'sectionSort' => 0,
            'sort' => 0,
        ];
        $dashboardItem = collect([[
            'group' => __($dashboardNavigation['group']),
            'groupSort' => $dashboardNavigation['groupSort'],
            'section' => __($dashboardNavigation['section']),
            'sectionSort' => $dashboardNavigation['sectionSort'],
            'sort' => $dashboardNavigation['sort'],
            'item' => [
                'label' => __($dashboardNavigation['label']),
                'href' => route($panel->route('dashboard')),
                'icon' => $dashboardNavigation['icon'],
                'badge' => null,
                'active' => $this->isActive($request, $panel->route('dashboard'), $dashboardNavigation),
            ],
        ]]);
        $navigationGroups = $dashboardItem
            ->merge($resourceItems)
            ->merge($pageItems)
            ->groupBy('group')
            ->map(fn ($resources, string $label): array => [
                'label' => $label,
                'sort' => $resources->min('groupSort'),
                'section' => $resources->first()['section'],
                'sectionSort' => $resources->min('sectionSort'),
                'items' => $resources
                    ->sortBy('sort')
                    ->pluck('item')
                    ->values()
                    ->all(),
            ])
            ->sortBy(fn (array $group): array => [
                $group['sectionSort'],
                $group['sort'],
            ])
            ->map(fn (array $group): array => [
                'label' => $group['label'],
                'section' => $group['section'],
                'sectionSort' => $group['sectionSort'],
                'items' => $group['items'],
            ])
            ->values()
            ->all();

        return [
            'dashboard' => route($panel->route('dashboard')),
            'logout' => route($panel->route('logout')),
            'globalSearch' => [
                'url' => route($panel->route('global-search')),
                'minimumQueryLength' => 2,
            ],
            'groups' => $navigationGroups,
            'labels' => [
                'search' => __('admin-panel::messages.navigation.search'),
                'searchResults' => __('admin-panel::messages.navigation.search_results'),
                'noResults' => __('admin-panel::messages.navigation.no_results'),
                'startTyping' => __('admin-panel::messages.navigation.start_typing'),
                'loading' => __('admin-panel::messages.navigation.loading'),
                'loadError' => __('admin-panel::messages.navigation.load_error'),
                'keyboardHint' => __('admin-panel::messages.navigation.keyboard_hint'),
            ],
        ];
    }

    /** @param array<string, mixed> $navigation */
    private function isActive(Request $request, string $routeName, array $navigation): bool
    {
        $patterns = array_merge([$routeName.'*'], $navigation['activeRoutes'] ?? []);

        foreach ($patterns as $pattern) {
            if (is_string($pattern) && $request->routeIs($pattern)) {
                return true;
            }
        }

        return false;
    }
}
