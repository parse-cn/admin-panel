<?php

namespace Parse\AdminPanel\Authorization\Console;

use Illuminate\Console\Command;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Filesystem\Filesystem;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Str;
use InvalidArgumentException;
use Parse\AdminPanel\Authorization\PolicyLocationResolver;
use Parse\AdminPanel\Infrastructure\Laravel\Panel\PanelManager;
use Parse\AdminPanel\Infrastructure\Laravel\Panel\PanelRuntime;
use Parse\AdminPanel\Resources\AdminPanelResource;
use Parse\AdminPanel\Resources\RegisteredResource;
use ReflectionMethod;
use Spatie\Permission\PermissionRegistrar;

final class GenerateAuthorizationCommand extends Command
{
    protected $signature = 'admin-panel:generate
        {--panel= : Panel ID}
        {--resource= : Registered resource or widget FQCN or short name; comma-separated}
        {--only= : Generate only permissions or policies}
        {--dry-run : Preview without writing files or database records}
        {--assign-role= : Append generated permissions to an existing role in the panel guard}';

    protected $description = 'Generate resource permissions and missing Laravel policies for a panel';

    private const array ACTIONS = [
        'viewAny' => ['index'],
        'view' => ['show'],
        'create' => ['create', 'store'],
        'update' => ['edit', 'update'],
        'delete' => ['destroy'],
    ];

    public function handle(PanelManager $panels, Filesystem $files): int
    {
        $panelId = $this->option('panel');
        if (! is_string($panelId) || $panelId === '') {
            $this->error('--panel is required.');

            return self::INVALID;
        }
        $only = $this->option('only');
        if ($only !== null && ! in_array($only, ['permissions', 'policies'], true)) {
            $this->error('--only must be permissions or policies.');

            return self::INVALID;
        }
        if ($only === 'policies' && $this->option('assign-role') !== null) {
            $this->error('--assign-role requires permission generation.');

            return self::INVALID;
        }

        try {
            $panel = $panels->panel($panelId);
            if (! $panel->authorizationEnabled) {
                throw new InvalidArgumentException('Authorization is disabled for this panel.');
            }
            $permissionModel = config('permission.models.permission');
            $permission = new $permissionModel;
            if (! $permission instanceof Model) {
                throw new InvalidArgumentException('The configured permission model must extend Eloquent Model.');
            }
            $registrations = $this->selectResources($panel);
            $plan = $this->plan($panel, $registrations, $panels, $files, $only !== 'permissions');
            $roleModel = config('permission.models.role');
            $role = $this->option('assign-role') === null ? null : $roleModel::query()
                ->where('guard_name', $panel->guard)->where('name', $this->option('assign-role'))->first();
            if ($this->option('assign-role') !== null && $role === null) {
                throw new InvalidArgumentException('The requested role does not exist in this panel guard.');
            }
        } catch (InvalidArgumentException $exception) {
            $this->error($exception->getMessage());

            return self::INVALID;
        }

        $names = [];
        foreach ($plan as $item) {
            $this->line($item['model'].' ['.$panel->guard.']');
            if ($only !== 'policies') {
                foreach ($item['permissions'] as $name) {
                    $names[] = $name;
                    $this->line('  Permission: '.$name);
                }
            }
            if ($only !== 'permissions') {
                $this->line('  Policy: '.$item['policy'].' ('.$item['status'].')');
                if (! $item['discoverable']) {
                    $this->warn('Register this policy explicitly: Gate::policy(\\'.$item['model'].'::class, \\'.$item['policy'].'::class);');
                }
            }
        }
        if ($role !== null) {
            $this->line('Append permissions to role: '.$role->name.' ['.$panel->guard.']');
        }
        if ($this->option('dry-run')) {
            $this->info('Preview complete; no files or database records were changed.');

            return self::SUCCESS;
        }

        $createdPolicies = 0;
        if ($only !== 'permissions') {
            foreach ($plan as $item) {
                if ($item['status'] !== 'create') {
                    continue;
                }
                $files->ensureDirectoryExists(dirname($item['path']));
                $files->put($item['path'], $item['contents']);
                $createdPolicies++;
            }
        }
        if ($only !== 'policies' && $names !== []) {
            $permission->getConnection()->transaction(function () use ($permissionModel, $names, $panel, $role): void {
                $permissions = [];
                foreach (array_unique($names) as $name) {
                    $permissions[] = $permissionModel::findOrCreate($name, $panel->guard);
                }
                $role?->givePermissionTo($permissions);
            });
            app(PermissionRegistrar::class)->forgetCachedPermissions();
        }
        $this->info(count(array_unique($names)).' permissions synchronized; '.$createdPolicies.' policies created. Existing policies were preserved.');

        return self::SUCCESS;
    }

    /**
     * @return list<RegisteredResource>
     */
    private function selectResources(PanelRuntime $panel): array
    {
        $registrations = [...$panel->resources(), ...$panel->widgets()];
        $selection = $this->option('resource');
        if ($selection === null) {
            return $registrations;
        }
        $resources = array_unique(array_map(fn (RegisteredResource $item): string => $item->resource, $registrations));
        $selected = [];
        foreach (explode(',', $selection) as $name) {
            $name = ltrim(trim($name), '\\');
            $matches = array_values(array_filter($resources, fn (string $resource): bool => $resource === $name || class_basename($resource) === $name));
            if ($name === '' || count($matches) !== 1) {
                throw new InvalidArgumentException("Resource [{$name}] must match exactly one registered resource or widget; use its FQCN if ambiguous.");
            }
            $selected[] = $matches[0];
        }

        return array_values(array_filter($registrations, fn (RegisteredResource $item): bool => in_array($item->resource, $selected, true)));
    }

    /**
     * @param  list<RegisteredResource>  $registrations
     * @return array<class-string<Model>, array<string, mixed>>
     */
    private function plan(PanelRuntime $panel, array $registrations, PanelManager $panels, Filesystem $files, bool $withPolicies): array
    {
        $plan = [];
        foreach ($registrations as $registration) {
            $resource = $registration->resource;
            $model = $resource::model();
            $prefix = $resource::permissionPrefix();
            if (! is_subclass_of($model, Model::class) || ! preg_match('/^[a-z][a-z0-9_]*(?:[.:-][a-z0-9_]+)*$/D', $prefix)) {
                throw new InvalidArgumentException("Resource [{$resource}] must declare an Eloquent model and a stable lowercase permission prefix.");
            }
            foreach ($panels->panels() as $otherPanel) {
                if (! $otherPanel->authorizationEnabled) {
                    continue;
                }
                foreach ([...$otherPanel->resources(), ...$otherPanel->widgets()] as $other) {
                    $otherResource = $other->resource;
                    if ($otherResource::model() === $model && $otherResource::permissionPrefix() !== $prefix) {
                        throw new InvalidArgumentException("Model [{$model}] has conflicting resource permission prefixes.");
                    }
                    if ($otherPanel->guard === $panel->guard && $otherResource::model() !== $model && $otherResource::permissionPrefix() === $prefix) {
                        throw new InvalidArgumentException("Permission prefix [{$prefix}] is shared by different models in guard [{$panel->guard}]. Override permissionPrefix().");
                    }
                }
            }
            if ((new ReflectionMethod($resource, 'authorize'))->getDeclaringClass()->getName() !== AdminPanelResource::class) {
                $this->warn("Resource [{$resource}] overrides authorize(); verify it delegates to the generated policy.");
            }
            $names = [];
            $routes = array_diff($registration->only ?? ['index', 'show', 'create', 'store', 'edit', 'update', 'destroy', 'bulk'], $registration->except);
            foreach (self::ACTIONS as $ability => $actions) {
                $enabled = match ($ability) {
                    'create' => $resource::canCreate(),
                    'update' => $resource::canUpdate(),
                    'delete' => $resource::canDelete(),
                    default => true,
                };
                if ($enabled && (array_intersect($actions, $routes) !== [] || ($ability === 'delete' && in_array('bulk', $routes, true)))) {
                    $names[] = $prefix.'.'.$ability;
                }
            }
            if (! isset($plan[$model])) {
                $plan[$model] = ['model' => $model, 'permissions' => []];
                if ($withPolicies) {
                    $plan[$model] += $this->policy($model, $prefix, $files);
                }
            }
            $plan[$model]['permissions'] = array_values(array_unique([...$plan[$model]['permissions'], ...$names]));
        }
        $classes = [];
        $paths = [];
        foreach ($plan as $item) {
            if (! $withPolicies || $item['status'] === 'keep registered policy') {
                continue;
            }
            $class = strtolower($item['policy']);
            $path = strtolower(str_replace('\\', '/', $item['path']));
            if (isset($classes[$class]) || isset($paths[$path])) {
                throw new InvalidArgumentException('Multiple models resolve to the same policy class or file. Adjust policy_locations or register their policies explicitly before generating.');
            }
            $classes[$class] = true;
            $paths[$path] = true;
        }

        return $plan;
    }

    /**
     * @param  class-string<Model>  $model
     * @return array<string, mixed>
     */
    private function policy(string $model, string $prefix, Filesystem $files): array
    {
        $existing = Gate::getPolicyFor($model);
        if ($existing !== null) {
            return ['policy' => $existing::class, 'status' => 'keep registered policy', 'discoverable' => true];
        }
        $location = app(PolicyLocationResolver::class)->resolve($model);
        $policy = $location['policy'];
        $path = $location['path'];
        $stub = $files->get(__DIR__.'/../../../stubs/admin-panel-policy.stub');
        $methods = [];
        foreach (array_keys(self::ACTIONS) as $ability) {
            $record = in_array($ability, ['viewAny', 'create'], true) ? '' : ', \\'.$model.' $record';
            $permission = var_export($prefix.'.'.$ability, true);
            $methods[] = "    public function {$ability}(Authenticatable \$user{$record}): bool\n    {\n        return \$this->allows(\$user, {$permission});\n    }\n";
        }
        $contents = str_replace(
            ['{{ namespace }}', '{{ class }}', '{{ methods }}'],
            [Str::beforeLast($policy, '\\'), class_basename($policy), implode("\n", $methods)],
            $stub,
        );

        return [
            'policy' => $policy,
            'path' => $path,
            'contents' => $contents,
            'status' => $files->exists($path) ? 'keep existing file' : 'create',
            'discoverable' => $location['discoverable'],
        ];
    }
}
