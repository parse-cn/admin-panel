<?php

namespace Parse\AdminPanel\Crud\Crud;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Parse\AdminPanel\Crud\Definition\CrudResourceRegistry;

final readonly class CrudNavigationBuilder
{
    public function __construct(private CrudResourceRegistry $registry) {}

    /**
     * @param  list<array<string, mixed>>  $items
     * @param  (Closure(string): bool)|null  $includeResource
     * @return list<array<string, mixed>>
     */
    public function build(
        Request $request,
        string $scope,
        string $defaultGroup,
        array $items = [],
        ?Closure $includeResource = null,
    ): array {
        $resourceItems = collect($this->registry->resources($scope))
            ->filter(fn (string $resource): bool => $resource::navigation() !== null)
            ->filter(fn (string $resource): bool => Route::has($resource::routeName()))
            ->when(
                $includeResource !== null,
                fn ($resources) => $resources->filter($includeResource),
            )
            ->map(function (string $resource) use ($defaultGroup, $request): array {
                $navigation = $resource::navigation();

                return [
                    'group' => $navigation['group'] ?? $defaultGroup,
                    'groupSort' => $navigation['groupSort'] ?? 10,
                    'label' => $navigation['label'],
                    'icon' => $navigation['icon'],
                    'href' => route($resource::routeName()),
                    'active' => $request->routeIs($resource::routeName().'*'),
                    'sort' => $navigation['sort'] ?? 100,
                ];
            });

        return collect($items)
            ->concat($resourceItems)
            ->groupBy('group')
            ->map(fn ($groupItems, string $label): array => [
                'label' => $label,
                'sort' => $groupItems->min('groupSort'),
                'items' => $groupItems
                    ->sortBy('sort')
                    ->map(fn (array $item): array => collect($item)
                        ->except(['group', 'groupSort', 'sort'])
                        ->all())
                    ->values()
                    ->all(),
            ])
            ->sortBy('sort')
            ->map(fn (array $group): array => collect($group)->except('sort')->all())
            ->values()
            ->all();
    }
}
