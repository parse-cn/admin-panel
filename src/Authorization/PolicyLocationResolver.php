<?php

namespace Parse\AdminPanel\Authorization;

use Illuminate\Support\Str;
use InvalidArgumentException;

final class PolicyLocationResolver
{
    /**
     * @return array{policy: string, path: string, discoverable: bool}
     */
    public function resolve(string $model): array
    {
        $locations = config('admin-panel.authorization.policy_locations', []);
        if (! is_array($locations)) {
            throw new InvalidArgumentException('Authorization policy_locations must be an array.');
        }

        foreach ($locations as $pattern => $location) {
            if (! is_string($pattern) || ! is_array($location)
                || ! is_string($location['namespace'] ?? null) || trim($location['namespace'], '\\') === ''
                || ! is_string($location['path'] ?? null) || trim($location['path']) === '') {
                throw new InvalidArgumentException('Each policy location requires a model namespace pattern, policy namespace, and path.');
            }
            $segments = explode('\\', trim($pattern, '\\'));
            if (count(array_keys($segments, '*', true)) > 1
                || ! $this->validNamespace(str_replace('*', 'Module', trim($pattern, '\\')))
                || count(array_filter($segments, fn (string $segment): bool => str_contains($segment, '*') && $segment !== '*')) > 0) {
                throw new InvalidArgumentException("Policy location pattern [{$pattern}] must be a namespace prefix with at most one wildcard segment.");
            }

            $modelSegments = explode('\\', $model);
            if (count($modelSegments) <= count($segments)) {
                continue;
            }
            $wildcard = null;
            foreach ($segments as $index => $segment) {
                if ($segment === '*') {
                    $wildcard = $modelSegments[$index];
                } elseif ($segment !== $modelSegments[$index]) {
                    continue 2;
                }
            }
            if ($wildcard === null && (str_contains($location['namespace'], '*') || str_contains($location['path'], '*'))) {
                throw new InvalidArgumentException("Policy location [{$pattern}] uses a wildcard in its output without a wildcard in the model namespace.");
            }

            $namespace = trim(str_replace('*', $wildcard ?? '', $location['namespace']), '\\');
            $directory = str_replace('*', $wildcard ?? '', $location['path']);
            if (! $this->validNamespace($namespace) || str_starts_with($directory, '/')
                || str_starts_with($directory, '\\') || preg_match('/^[A-Za-z]:/', $directory)) {
                throw new InvalidArgumentException("Policy location [{$pattern}] requires a valid policy namespace and a path relative to the application root.");
            }
            $relative = implode('\\', array_slice($modelSegments, count($segments)));

            return [
                'policy' => $namespace.'\\'.$relative.'Policy',
                'path' => base_path(rtrim($directory, '/\\').'/'.str_replace('\\', '/', $relative).'Policy.php'),
                'discoverable' => false,
            ];
        }

        $namespace = app()->getNamespace();
        $modelRoot = $namespace.'Models\\';
        $relative = Str::startsWith($model, $modelRoot) ? Str::after($model, $modelRoot) : $model;
        $policy = $namespace.'Policies\\'.$relative.'Policy';

        return [
            'policy' => $policy,
            'path' => app_path(str_replace('\\', '/', Str::after($policy, $namespace)).'.php'),
            'discoverable' => Str::startsWith($model, $modelRoot),
        ];
    }

    private function validNamespace(string $namespace): bool
    {
        return preg_match('/^[A-Za-z_][A-Za-z0-9_]*(?:\\\\[A-Za-z_][A-Za-z0-9_]*)*$/D', $namespace) === 1;
    }
}
