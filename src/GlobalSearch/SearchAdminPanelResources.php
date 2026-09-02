<?php

namespace Parse\AdminPanel\GlobalSearch;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Parse\AdminPanel\Infrastructure\Laravel\Panel\PanelRuntime;
use Parse\AdminPanel\Resources\RegisteredResource;

final class SearchAdminPanelResources
{
    private const RESULTS_PER_RESOURCE = 5;

    /**
     * @return list<array{
     *     resource: string,
     *     title: string,
     *     icon: string|null,
     *     results: list<array{
     *         key: string|int,
     *         title: string,
     *         details: array<string, string|null>,
     *         url: string,
     *         icon: string|null,
     *         image: string|null
     *     }>
     * }>
     */
    public function execute(Request $request, PanelRuntime $panel, string $search): array
    {
        return collect($panel->resources())
            ->filter(fn (RegisteredResource $registration): bool => $registration->resource::isGloballySearchable())
            ->sortBy(fn (RegisteredResource $registration): int => $registration->resource::globalSearchSort())
            ->map(fn (RegisteredResource $registration): ?array => $this->searchResource(
                $request,
                $registration,
                $search,
            ))
            ->filter()
            ->values()
            ->all();
    }

    /**
     * @return array<string, mixed>|null
     */
    private function searchResource(
        Request $request,
        RegisteredResource $registration,
        string $search,
    ): ?array {
        $resource = $registration->resource;
        $user = $resource::user($request);
        $attributes = $resource::globallySearchableAttributes();

        if ($user === null || $attributes === [] || ! $resource::authorize('viewAny', $user)) {
            return null;
        }

        $query = $resource::globalSearchQuery();
        $eagerLoads = $resource::globalSearchEagerLoads();

        if ($eagerLoads !== []) {
            $query->with($eagerLoads);
        }

        $escapedSearch = addcslashes($search, '\\%_');
        $query->where(function (Builder $query) use ($attributes, $escapedSearch): void {
            foreach ($attributes as $attribute) {
                $this->applyAttributeConstraint($query, $attribute, $escapedSearch);
            }
        });

        $results = $query
            ->limit(self::RESULTS_PER_RESOURCE * 2)
            ->get()
            ->filter(fn (Model $record): bool => $resource::authorize('view', $user, $record))
            ->map(function (Model $record) use ($resource): ?array {
                $url = $resource::globalSearchResultUrl($record);

                if ($url === null) {
                    return null;
                }

                return [
                    'key' => $record->getAttribute($resource::routeKeyName()),
                    'title' => $resource::globalSearchResultTitle($record),
                    'details' => $resource::globalSearchResultDetails($record),
                    'url' => $url,
                    'icon' => $resource::globalSearchResultIcon($record),
                    'image' => $resource::globalSearchResultImage($record),
                ];
            })
            ->filter()
            ->take(self::RESULTS_PER_RESOURCE)
            ->values()
            ->all();

        if ($results === []) {
            return null;
        }

        return [
            'resource' => $registration->uri,
            'title' => $resource::title(),
            'icon' => $resource::globalSearchResourceIcon(),
            'results' => $results,
        ];
    }

    private function applyAttributeConstraint(Builder $query, string $attribute, string $search): void
    {
        if (! str_contains($attribute, '.')) {
            $query->orWhereLike($attribute, "%{$search}%");

            return;
        }

        $relation = str($attribute)->beforeLast('.')->toString();
        $column = str($attribute)->afterLast('.')->toString();

        $query->orWhereHas(
            $relation,
            fn (Builder $relationQuery): Builder => $relationQuery->whereLike($column, "%{$search}%"),
        );
    }
}
