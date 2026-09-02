<?php

namespace Parse\AdminPanel\Crud\Http\Controllers;

use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Str;
use Parse\AdminPanel\Crud\Application\Commands\CreateRecordCommand;
use Parse\AdminPanel\Crud\Application\Commands\DeleteRecordCommand;
use Parse\AdminPanel\Crud\Application\Commands\ExecuteBulkActionCommand;
use Parse\AdminPanel\Crud\Application\Commands\UpdateRecordCommand;
use Parse\AdminPanel\Crud\Application\CreateRecordCommandHandler;
use Parse\AdminPanel\Crud\Application\DeleteRecordCommandHandler;
use Parse\AdminPanel\Crud\Application\ExecuteBulkActionHandler;
use Parse\AdminPanel\Crud\Application\ListRecords;
use Parse\AdminPanel\Crud\Application\ListRecordsQuery;
use Parse\AdminPanel\Crud\Application\UpdateRecordCommandHandler;
use Parse\AdminPanel\Crud\Contracts\CrudAuthorizer;
use Parse\AdminPanel\Crud\Definition\CrudResourceRegistry;
use Parse\AdminPanel\Crud\Http\Controllers\Concerns\ResolvesCrudFilters;
use Parse\AdminPanel\Crud\Http\Requests\ExecuteBulkActionRequest;
use Parse\AdminPanel\Crud\Infrastructure\Laravel\Resources\EloquentCrudResource as CrudResource;

final class CrudWidgetController extends Controller
{
    use ResolvesCrudFilters;

    public function __construct(
        private readonly CrudAuthorizer $authorizer,
        private readonly CrudResourceRegistry $registry,
        private readonly ListRecords $listRecords,
        private readonly CreateRecordCommandHandler $createRecord,
        private readonly UpdateRecordCommandHandler $updateRecord,
        private readonly DeleteRecordCommandHandler $deleteRecord,
        private readonly ExecuteBulkActionHandler $executeBulkAction,
    ) {}

    public function index(Request $request, string $resource): JsonResponse
    {
        $resourceClass = $this->resource($resource);
        $user = $this->authorizer->authorize($resourceClass, 'viewAny', $resourceClass::user($request));
        $context = $this->context($request);
        $search = $request->string('search')->trim()->toString();
        $requestedSort = $request->string('sort')->toString();
        $defaultSort = $resourceClass::defaultSort();
        $hasRequestedSort = in_array($requestedSort, $resourceClass::sortableColumns(), true);
        $sort = $hasRequestedSort ? $requestedSort : ($defaultSort['column'] ?? '');
        $direction = $request->string('direction')->toString() === 'asc' ? 'asc' : 'desc';
        $direction = $hasRequestedSort ? $direction : ($defaultSort['direction'] ?? 'desc');
        $defaultPerPage = max(1, $resourceClass::perPage());
        $requestedPerPage = $request->integer('per_page', $defaultPerPage);
        $perPage = in_array($requestedPerPage, $resourceClass::resolvedPerPageOptions(), true)
            ? $requestedPerPage
            : $defaultPerPage;
        $conditions = $this->filters($request, $resourceClass);

        $records = $this->listRecords->handle(new ListRecordsQuery(
            resource: $resourceClass,
            search: $search,
            sort: $sort,
            direction: $direction,
            perPage: $perPage,
            filters: $conditions,
            context: $context,
            isWidget: true,
        ))->through(
            fn (Model $record): array => $this->record(
                $resourceClass,
                $resource,
                $record,
                $user,
                forDetail: false,
            ),
        );

        return response()->json([
            'resource' => $this->definition($resourceClass, $resource, $user),
            'records' => $records,
            'filters' => [
                'search' => $search,
                'sort' => $sort,
                'direction' => $direction,
                'perPage' => $perPage,
                'conditions' => $conditions,
            ],
            'routes' => $this->routes($resource),
        ]);
    }

    public function store(Request $request, string $resource): JsonResponse
    {
        $resourceClass = $this->resource($resource);
        abort_unless($this->registry->allows($resourceClass, 'store'), 404);
        $record = $this->createRecord->handle(new CreateRecordCommand(
            resource: $resourceClass,
            attributes: $request->all(),
            actor: $resourceClass::user($request),
        ));

        return response()->json([
            'record' => $this->record(
                $resourceClass,
                $resource,
                $record,
                $resourceClass::user($request),
            ),
        ], 201);
    }

    public function update(Request $request, string $resource, string $record): JsonResponse
    {
        $resourceClass = $this->resource($resource);
        abort_unless($this->registry->allows($resourceClass, 'update'), 404);
        $model = $this->updateRecord->handle(new UpdateRecordCommand(
            resource: $resourceClass,
            recordKey: $record,
            attributes: $request->all(),
            actor: $resourceClass::user($request),
            context: $this->context($request),
            isWidget: true,
        ));

        return response()->json([
            'record' => $this->record(
                $resourceClass,
                $resource,
                $model,
                $resourceClass::user($request),
            ),
        ]);
    }

    public function destroy(Request $request, string $resource, string $record): JsonResponse
    {
        $resourceClass = $this->resource($resource);
        abort_unless($this->registry->allows($resourceClass, 'destroy'), 404);
        $this->deleteRecord->handle(new DeleteRecordCommand(
            resource: $resourceClass,
            recordKey: $record,
            actor: $resourceClass::user($request),
            context: $this->context($request),
            isWidget: true,
        ));

        return response()->json([], 204);
    }

    public function bulk(ExecuteBulkActionRequest $request, string $resource): JsonResponse
    {
        $resourceClass = $this->resource($resource);
        abort_unless($this->registry->allows($resourceClass, 'bulk'), 404);
        $validated = $request->validated();
        $result = $this->executeBulkAction->handle(new ExecuteBulkActionCommand(
            resource: $resourceClass,
            action: $validated['action'],
            recordKeys: array_map(strval(...), $validated['keys']),
            actor: $resourceClass::user($request),
            context: $this->context($request),
            isWidget: true,
        ));

        return response()->json([
            'action' => $result['action'],
            'count' => count($result['records']),
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function context(Request $request): array
    {
        $context = $request->input('context', []);

        if (! is_array($context)) {
            return [];
        }

        return collect($context)
            ->filter(fn (mixed $value): bool => is_string($value) || is_int($value) || is_float($value) || is_bool($value) || $value === null)
            ->all();
    }

    /**
     * @return class-string<CrudResource>
     */
    private function resource(string $identifier): string
    {
        $resource = $this->registry->resolve($identifier);

        abort_unless($resource !== null, 404);

        return $resource;
    }

    /**
     * @param  class-string<CrudResource>  $resource
     * @return array<string, mixed>
     */
    private function definition(string $resource, string $identifier, Authenticatable $user): array
    {
        return [
            ...$resource::definition(),
            ...$resource::widgetConfig(),
            'permissions' => [
                'create' => $resource::canCreate()
                    && $this->registry->allows($resource, 'store')
                    && $resource::authorize('create', $user),
                'update' => $resource::canUpdate() && $this->registry->allows($resource, 'update'),
                'delete' => $resource::canDelete() && $this->registry->allows($resource, 'destroy'),
                'bulk' => $this->registry->allows($resource, 'bulk') && $resource::bulkActions($user) !== [],
            ],
            'bulkActions' => $this->registry->allows($resource, 'bulk')
                ? collect($resource::bulkActions($user))
                    ->map(fn (array $action): array => [
                        ...$action,
                        'method' => 'post',
                        'url' => $this->routes($identifier)['bulk'],
                    ])
                    ->values()
                    ->all()
                : [],
        ];
    }

    /**
     * @param  class-string<CrudResource>  $resource
     * @return array<string, mixed>
     */
    private function record(
        string $resource,
        string $identifier,
        Model $record,
        ?Authenticatable $user,
        bool $forDetail = true,
    ): array {
        abort_unless($user !== null, 403);

        return [
            ...($forDetail ? $resource::record($record) : $resource::recordForIndex($record)),
            'routes' => $this->routes($identifier, $record),
            'actions' => $resource::recordActions($record, $user),
        ];
    }

    /**
     * @return array<string, string|null>
     */
    private function routes(string $resource, ?Model $record = null): array
    {
        $prefix = Str::beforeLast($resource, '.');
        $route = fn (string $name, array $parameters = []): string => route("{$prefix}.{$name}", [
            'resource' => $resource,
            ...$parameters,
        ]);
        $resourceClass = $this->resource($resource);
        $key = $record?->getAttribute($resourceClass::routeKeyName());

        return [
            'index' => $route('crud.widget.data'),
            'create' => $route('crud.widget.store'),
            'show' => null,
            'edit' => $key === null ? null : $route('crud.widget.update', ['record' => $key]),
            'destroy' => $key === null ? null : $route('crud.widget.destroy', ['record' => $key]),
            'bulk' => $route('crud.widget.bulk'),
        ];
    }
}
