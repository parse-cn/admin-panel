<?php

namespace Parse\AdminPanel\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Parse\AdminPanel\GlobalSearch\SearchAdminPanelResources;
use Parse\AdminPanel\Http\Requests\GlobalSearchRequest;
use Parse\AdminPanel\Infrastructure\Laravel\Panel\PanelManager;

final readonly class GlobalSearchController
{
    public function __construct(
        private PanelManager $panels,
        private SearchAdminPanelResources $search,
    ) {}

    public function __invoke(GlobalSearchRequest $request): JsonResponse
    {
        return response()->json([
            'groups' => $this->search->execute(
                $request,
                $this->panels->current($request),
                $request->searchTerm(),
            ),
        ]);
    }
}
