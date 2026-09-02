<?php

namespace Parse\AdminPanel\Crud\Http\Controllers;

use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Inertia\Response;
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
use Parse\AdminPanel\Crud\Http\Controllers\Concerns\ResolvesCrudFilters;
use Parse\AdminPanel\Crud\Http\Requests\ExecuteBulkActionRequest;
use Parse\AdminPanel\Crud\Infrastructure\Laravel\Resources\EloquentCrudResource as CrudResource;

final class CrudController extends Controller
{
    use ResolvesCrudFilters;

    public function __construct(
        private readonly CrudAuthorizer $authorizer,
        private readonly ListRecords $listRecords,
        private readonly CreateRecordCommandHandler $createRecord,
        private readonly UpdateRecordCommandHandler $updateRecord,
        private readonly DeleteRecordCommandHandler $deleteRecord,
        private readonly ExecuteBulkActionHandler $executeBulkAction,
    ) {}

    public function index(Request $request): Response
    {
        $resource = $this->resource($request);
        $user = $this->authorizer->authorize($resource, 'viewAny', $resource::user($request));

        return Inertia::render($resource::indexComponent(), $this->indexPageProps(
            $request,
            $resource,
            $user,
        ));
    }

    /**
     * @param  class-string<CrudResource>  $resource
     * @return array<string, mixed>
     */
    private function indexPageProps(
        Request $request,
        string $resource,
        Authenticatable $user,
    ): array {
        $search = $request->string('search')->trim()->toString();
        $requestedSort = $request->string('sort')->toString();
        $requestedDirection = $request->string('direction')->toString() === 'asc' ? 'asc' : 'desc';
        $defaultSort = $resource::defaultSort();
        $hasRequestedSort = in_array($requestedSort, $resource::sortableColumns(), true);
        $sort = $hasRequestedSort ? $requestedSort : ($defaultSort['column'] ?? '');
        $direction = $hasRequestedSort ? $requestedDirection : ($defaultSort['direction'] ?? 'desc');
        $defaultPerPage = max(1, $resource::perPage());
        $requestedPerPage = $request->integer('per_page', $defaultPerPage);
        $perPage = in_array($requestedPerPage, $resource::resolvedPerPageOptions(), true)
            ? $requestedPerPage
            : $defaultPerPage;
        $conditions = $this->filters($request, $resource);

        $records = $this->listRecords->handle(new ListRecordsQuery(
            resource: $resource,
            search: $search,
            sort: $sort,
            direction: $direction,
            perPage: $perPage,
            filters: $conditions,
        ))->through(
            fn (Model $record): array => $this->record($resource, $record, $user, forDetail: false),
        );

        return [
            ...$resource::indexProps(),
            'resource' => $this->definition($resource, $user),
            'records' => $records,
            'filters' => compact('search', 'sort', 'direction', 'perPage', 'conditions'),
            'routes' => $this->routes($resource),
        ];
    }

    public function create(Request $request): Response
    {
        $resource = $this->resource($request);
        $user = $this->authorizer->authorize($resource, 'create', $resource::user($request));

        $createProps = [
            ...$resource::createProps(),
            'resource' => $this->definition($resource, $user),
            'record' => null,
            'routes' => $this->routes($resource),
            'submit' => ['method' => 'post', 'url' => route($resource::routeName().'.store')],
        ];

        if ($resource::createWithinIndex($request)) {
            $indexUser = $this->authorizer->authorize($resource, 'viewAny', $resource::user($request));

            return Inertia::render($resource::indexComponent(), [
                ...$this->indexPageProps($request, $resource, $indexUser),
                'createOpen' => true,
                'createForm' => Inertia::defer(fn (): array => [
                    'component' => $resource::createSheetComponent(),
                    'props' => $createProps,
                ]),
            ]);
        }

        return Inertia::render($resource::createComponent(), $createProps);
    }

    public function store(Request $request): RedirectResponse
    {
        $resource = $this->resource($request);
        $record = $this->createRecord->handle(new CreateRecordCommand(
            resource: $resource,
            attributes: $request->all(),
            actor: $resource::user($request),
        ));

        return to_route($resource::routeName().'.show', $record->getAttribute($resource::routeKeyName()));
    }

    public function show(Request $request, string $record): Response
    {
        $resource = $this->resource($request);
        $model = $resource::resolveRecord($record);
        $user = $this->authorizer->authorize($resource, 'view', $resource::user($request), $model);

        $showProps = [
            ...$resource::showProps($model),
            'resource' => $this->definition($resource, $user),
            'record' => $this->record($resource, $model, $user),
            'routes' => $this->routes($resource, $model),
        ];

        if ($resource::showWithinIndex($request, $model)) {
            $indexUser = $this->authorizer->authorize($resource, 'viewAny', $resource::user($request));

            return Inertia::render($resource::indexComponent(), [
                ...$this->indexPageProps($request, $resource, $indexUser),
                'detailId' => (string) $model->getAttribute($resource::routeKeyName()),
                'detail' => Inertia::defer(fn (): array => [
                    'component' => $resource::showComponent(),
                    'props' => $showProps,
                ]),
            ]);
        }

        return Inertia::render($resource::showPageComponent(), [
            ...$showProps,
            'detailComponent' => $resource::showComponent(),
        ]);
    }

    public function edit(Request $request, string $record): Response
    {
        $resource = $this->resource($request);
        $model = $resource::resolveRecord($record);
        $user = $this->authorizer->authorize($resource, 'update', $resource::user($request), $model);

        $editProps = [
            ...$resource::editProps($model),
            'resource' => $this->definition($resource, $user),
            'record' => $this->record($resource, $model, $user),
            'routes' => $this->routes($resource, $model),
            'submit' => [
                'method' => 'put',
                'url' => route($resource::routeName().'.update', $model->getAttribute($resource::routeKeyName())),
            ],
        ];

        if ($resource::editWithinIndex($request, $model)) {
            $indexUser = $this->authorizer->authorize($resource, 'viewAny', $resource::user($request));

            return Inertia::render($resource::indexComponent(), [
                ...$this->indexPageProps($request, $resource, $indexUser),
                'editId' => (string) $model->getAttribute($resource::routeKeyName()),
                'edit' => Inertia::defer(fn (): array => [
                    'component' => $resource::editSheetComponent(),
                    'props' => $editProps,
                ]),
            ]);
        }

        return Inertia::render($resource::editComponent(), $editProps);
    }

    public function update(Request $request, string $record): RedirectResponse
    {
        $resource = $this->resource($request);
        $model = $this->updateRecord->handle(new UpdateRecordCommand(
            resource: $resource,
            recordKey: $record,
            attributes: $request->all(),
            actor: $resource::user($request),
        ));

        return to_route($resource::routeName().'.show', $model->getAttribute($resource::routeKeyName()));
    }

    public function destroy(Request $request, string $record): RedirectResponse
    {
        $resource = $this->resource($request);
        $this->deleteRecord->handle(new DeleteRecordCommand(
            resource: $resource,
            recordKey: $record,
            actor: $resource::user($request),
        ));

        return to_route($resource::routeName())->with('toast', [
            'type' => 'success',
            'message' => trans_choice('admin-panel::messages.crud.toast.deleted', 1, [
                'resource' => $resource::singularLabel(),
            ]),
        ]);
    }

    public function bulk(ExecuteBulkActionRequest $request): RedirectResponse
    {
        $resource = $this->resource($request);
        $validated = $request->validated();
        $result = $this->executeBulkAction->handle(new ExecuteBulkActionCommand(
            resource: $resource,
            action: $validated['action'],
            recordKeys: array_map(strval(...), $validated['keys']),
            actor: $resource::user($request),
        ));
        $action = $result['action'];
        $records = $result['records'];

        if ($action === 'delete') {
            return to_route($resource::routeName())->with('toast', [
                'type' => 'success',
                'message' => trans_choice('admin-panel::messages.crud.toast.deleted', count($records), [
                    'count' => count($records),
                    'resource' => $resource::title(),
                ]),
            ]);
        }

        return to_route($resource::routeName());
    }

    /**
     * @return class-string<CrudResource>
     */
    private function resource(Request $request): string
    {
        $resource = $request->route('resource');

        abort_unless(is_string($resource) && is_subclass_of($resource, CrudResource::class), 404);

        return $resource;
    }

    /**
     * @param  class-string<CrudResource>  $resource
     * @return array<string, string|null>
     */
    private function routes(string $resource, ?Model $record = null): array
    {
        $name = $resource::routeName();
        $key = $record?->getAttribute($resource::routeKeyName());

        return [
            'index' => Route::has($name) ? route($name) : url('/'),
            'create' => $resource::canCreate() && Route::has($name.'.create') && Route::has($name.'.store')
                ? route($name.'.create')
                : null,
            'show' => $key && Route::has($name.'.show') ? route($name.'.show', $key) : null,
            'edit' => $key && $resource::canUpdate() && Route::has($name.'.edit') && Route::has($name.'.update')
                ? route($name.'.edit', $key)
                : null,
            'destroy' => $key && $resource::canDelete() && Route::has($name.'.destroy')
                ? route($name.'.destroy', $key)
                : null,
            'bulk' => Route::has($name.'.bulk') ? route($name.'.bulk') : null,
        ];
    }

    /**
     * @param  class-string<CrudResource>  $resource
     * @return array<string, mixed>
     */
    private function record(
        string $resource,
        Model $record,
        Authenticatable $user,
        bool $forDetail = true,
    ): array {
        return [
            ...($forDetail ? $resource::record($record) : $resource::recordForIndex($record)),
            'routes' => $this->routes($resource, $record),
            'actions' => $resource::recordActions($record, $user),
        ];
    }

    /**
     * @param  class-string<CrudResource>  $resource
     * @return array<string, mixed>
     */
    private function definition(string $resource, Authenticatable $user): array
    {
        $name = $resource::routeName();

        return [
            ...$resource::definition(),
            'canCreate' => $resource::canCreate()
                && Route::has($name.'.create')
                && Route::has($name.'.store'),
            'canUpdate' => $resource::canUpdate()
                && Route::has($name.'.edit')
                && Route::has($name.'.update'),
            'canDelete' => $resource::canDelete()
                && Route::has($name.'.destroy'),
            'bulkActions' => Route::has($name.'.bulk')
                ? collect($resource::bulkActions($user))
                    ->map(fn (array $action): array => [
                        ...$action,
                        'method' => 'post',
                        'url' => route($name.'.bulk'),
                    ])
                    ->values()
                    ->all()
                : [],
        ];
    }
}
