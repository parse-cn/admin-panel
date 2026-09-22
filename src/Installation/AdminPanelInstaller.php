<?php

namespace Parse\AdminPanel\Installation;

use Illuminate\Filesystem\Filesystem;
use JsonException;

final readonly class AdminPanelInstaller
{
    private const string VITE_ENTRY = 'resources/js/admin-panel.tsx';

    private const string PACKAGE_VITE_ENTRY = 'vendor/parse/admin-panel/resources/js/app.tsx';

    /**
     * The plugin's own package.json is the single source of truth for the
     * frontend dependencies host applications must declare.
     */
    private const string PACKAGE_MANIFEST = '/package.json';

    public function __construct(
        private Filesystem $files,
    ) {}

    public function install(string $applicationPath): AdminPanelInstallResult
    {
        $completed = [];
        $unchanged = [];
        $warnings = [];

        $this->installConfiguration(
            $applicationPath,
            $completed,
            $unchanged,
            $warnings,
        );
        $this->installAdminRoutes(
            $applicationPath,
            $completed,
            $unchanged,
            $warnings,
        );
        $this->installNodeDependencies(
            $applicationPath,
            $completed,
            $unchanged,
            $warnings,
        );
        $this->installApplicationViteEntry(
            $applicationPath,
            $completed,
            $unchanged,
            $warnings,
        );
        $this->installViteEntry(
            $applicationPath,
            $completed,
            $unchanged,
            $warnings,
        );
        $this->installTypeScriptSources(
            $applicationPath,
            $completed,
            $unchanged,
            $warnings,
        );

        return new AdminPanelInstallResult($completed, $unchanged, $warnings);
    }

    /**
     * @param  list<string>  $completed
     * @param  list<string>  $unchanged
     * @param  list<string>  $warnings
     */
    private function installAdminRoutes(
        string $applicationPath,
        array &$completed,
        array &$unchanged,
        array &$warnings,
    ): void {
        $source = dirname(__DIR__, 2).'/stubs/routes.admin.stub';
        $destination = $applicationPath.'/routes/admin-panel.php';

        if ($this->files->exists($destination)) {
            $unchanged[] = 'routes/admin-panel.php already exists';

            return;
        }

        if (! $this->files->exists($source)) {
            $warnings[] = 'Admin route stub could not be located';

            return;
        }

        $this->files->ensureDirectoryExists(dirname($destination));
        $this->files->copy($source, $destination);
        $completed[] = 'Created routes/admin-panel.php';
    }

    /**
     * @param  list<string>  $completed
     * @param  list<string>  $unchanged
     * @param  list<string>  $warnings
     */
    private function installConfiguration(
        string $applicationPath,
        array &$completed,
        array &$unchanged,
        array &$warnings,
    ): void {
        $source = dirname(__DIR__, 2).'/config/admin-panel.php';
        $destination = $applicationPath.'/config/admin-panel.php';

        if ($this->files->exists($destination)) {
            $unchanged[] = 'Configuration already exists';

            return;
        }

        if (! $this->files->exists($source)) {
            $warnings[] = 'Package configuration could not be located';

            return;
        }

        $this->files->ensureDirectoryExists(dirname($destination));
        $this->files->copy($source, $destination);
        $completed[] = 'Published config/admin-panel.php';
    }

    /**
     * @param  list<string>  $completed
     * @param  list<string>  $unchanged
     * @param  list<string>  $warnings
     */
    private function installNodeDependencies(
        string $applicationPath,
        array &$completed,
        array &$unchanged,
        array &$warnings,
    ): void {
        $manifestPath = $applicationPath.'/package.json';

        if (! $this->files->exists($manifestPath)) {
            $warnings[] = 'package.json was not found; install frontend dependencies manually';

            return;
        }

        try {
            /** @var array<string, mixed> $manifest */
            $manifest = json_decode(
                $this->files->get($manifestPath),
                true,
                flags: JSON_THROW_ON_ERROR,
            );
        } catch (JsonException) {
            $warnings[] = 'package.json is invalid; it was not changed';

            return;
        }

        $packageDependencies = $this->pluginPackageSections();

        if ($packageDependencies === null) {
            $warnings[] = 'Admin Panel package.json manifest could not be read; install frontend dependencies manually';

            return;
        }

        $dependenciesChanged = $this->mergeDependencies(
            $manifest,
            'dependencies',
            $packageDependencies['dependencies'],
        );
        $devDependenciesChanged = $this->mergeDependencies(
            $manifest,
            'devDependencies',
            $packageDependencies['devDependencies'],
        );

        if (! $dependenciesChanged && ! $devDependenciesChanged) {
            $unchanged[] = 'Frontend dependencies are already declared';

            return;
        }

        $this->files->replace(
            $manifestPath,
            json_encode(
                $manifest,
                JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR,
            ).PHP_EOL,
        );
        $completed[] = 'Added missing frontend dependencies to package.json';
    }

    /**
     * Publish a local entry point so Laravel's Vite integration always serves a
     * source file from the host application, rather than raw TSX from vendor.
     *
     * @param  list<string>  $completed
     * @param  list<string>  $unchanged
     * @param  list<string>  $warnings
     */
    private function installApplicationViteEntry(
        string $applicationPath,
        array &$completed,
        array &$unchanged,
        array &$warnings,
    ): void {
        $source = dirname(__DIR__, 2).'/stubs/admin-panel.tsx.stub';
        $destination = $applicationPath.'/resources/js/admin-panel.tsx';

        if ($this->files->exists($destination)) {
            $unchanged[] = 'Admin Panel application Vite entry already exists';
        } elseif (! $this->files->exists($source)) {
            $warnings[] = 'Admin Panel Vite entry stub could not be located';
        } else {
            $this->files->ensureDirectoryExists(dirname($destination));
            $this->files->copy($source, $destination);
            $completed[] = 'Created the Admin Panel application Vite entry';
        }

        $configPath = $applicationPath.'/config/admin-panel.php';

        if (! $this->files->exists($configPath)) {
            return;
        }

        $contents = $this->files->get($configPath);

        if (! str_contains($contents, self::PACKAGE_VITE_ENTRY)) {
            return;
        }

        $this->files->replace(
            $configPath,
            str_replace(self::PACKAGE_VITE_ENTRY, self::VITE_ENTRY, $contents),
        );
        $completed[] = 'Configured the Admin Panel application Vite entry';
    }

    /**
     * @return array{dependencies: array<string, string>, devDependencies: array<string, string>}|null
     */
    private function pluginPackageSections(): ?array
    {
        $manifestPath = dirname(__DIR__, 2).self::PACKAGE_MANIFEST;

        if (! $this->files->exists($manifestPath)) {
            return null;
        }

        try {
            /** @var array<string, mixed> $manifest */
            $manifest = json_decode(
                $this->files->get($manifestPath),
                true,
                flags: JSON_THROW_ON_ERROR,
            );
        } catch (JsonException) {
            return null;
        }

        return [
            'dependencies' => $this->stringMap($manifest['dependencies'] ?? []),
            'devDependencies' => $this->stringMap($manifest['devDependencies'] ?? []),
        ];
    }

    /**
     * @param  mixed  $values
     * @return array<string, string>
     */
    private function stringMap(mixed $values): array
    {
        if (! is_array($values)) {
            return [];
        }

        $map = [];

        foreach ($values as $package => $constraint) {
            if (is_string($package) && is_string($constraint)) {
                $map[$package] = $constraint;
            }
        }

        return $map;
    }

    /**
     * @param  array<string, mixed>  $manifest
     * @param  array<string, string>  $required
     */
    private function mergeDependencies(
        array &$manifest,
        string $section,
        array $required,
    ): bool {
        $dependencies = $manifest[$section] ?? [];

        if (! is_array($dependencies)) {
            $dependencies = [];
        }

        $changed = false;

        foreach ($required as $package => $constraint) {
            if (array_key_exists($package, $dependencies)) {
                continue;
            }

            $dependencies[$package] = $constraint;
            $changed = true;
        }

        ksort($dependencies);
        $manifest[$section] = $dependencies;

        return $changed;
    }

    /**
     * @param  list<string>  $completed
     * @param  list<string>  $unchanged
     * @param  list<string>  $warnings
     */
    private function installViteEntry(
        string $applicationPath,
        array &$completed,
        array &$unchanged,
        array &$warnings,
    ): void {
        $viteConfig = $this->firstExistingFile([
            $applicationPath.'/vite.config.ts',
            $applicationPath.'/vite.config.js',
        ]);

        if ($viteConfig === null) {
            $warnings[] = 'vite.config.ts or vite.config.js was not found';

            return;
        }

        $contents = $this->files->get($viteConfig);
        $entryWasRegistered = str_contains($contents, "'".self::VITE_ENTRY."'")
            || str_contains($contents, '"'.self::VITE_ENTRY.'"');

        if (! $entryWasRegistered) {
            $updated = $this->addViteEntry($contents);

            if ($updated === null) {
                $warnings[] = "Add '".self::VITE_ENTRY."' to the Laravel Vite input list";

                return;
            }

            $contents = $updated;
            $completed[] = 'Registered the Admin Panel Vite entry';
        } else {
            $unchanged[] = 'Admin Panel Vite entry is already registered';
        }

        $inertiaPluginIsRegistered = str_contains($contents, "from '@inertiajs/vite'")
            && preg_match('/\binertia\s*\(/', $contents) === 1;

        if ($inertiaPluginIsRegistered) {
            $unchanged[] = 'Inertia Vite plugin is already registered';
        } else {
            $updated = $this->addInertiaVitePlugin($contents);

            if ($updated === null) {
                $warnings[] = 'Register the @inertiajs/vite plugin in the Vite configuration';
            } else {
                $contents = $updated;
                $completed[] = 'Registered the Inertia Vite plugin';
            }
        }

        $reactPluginIsRegistered = str_contains($contents, "from '@vitejs/plugin-react'")
            && preg_match('/\breact\s*\(/', $contents) === 1;

        if ($reactPluginIsRegistered) {
            $unchanged[] = 'React Vite plugin is already registered';
        } else {
            $updated = $this->addReactVitePlugin($contents);

            if ($updated === null) {
                $warnings[] = 'Register the @vitejs/plugin-react plugin in the Vite configuration';
            } else {
                $contents = $updated;
                $completed[] = 'Registered the React Vite plugin';
            }
        }

        $tailwindPluginIsRegistered = str_contains($contents, "from '@tailwindcss/vite'")
            && preg_match('/\btailwindcss\s*\(/', $contents) === 1;

        if ($tailwindPluginIsRegistered) {
            $unchanged[] = 'Tailwind Vite plugin is already registered';
        } else {
            $updated = $this->addTailwindVitePlugin($contents);

            if ($updated === null) {
                $warnings[] = 'Register the @tailwindcss/vite plugin in the Vite configuration';
            } else {
                $contents = $updated;
                $completed[] = 'Registered the Tailwind Vite plugin';
            }
        }

        $adminPanelAliasIsRegistered = str_contains($contents, "'@admin-panel'")
            || str_contains($contents, '"@admin-panel"');

        if ($adminPanelAliasIsRegistered) {
            $unchanged[] = 'Admin Panel Vite alias is already registered';
        } else {
            $updated = $this->addAdminPanelViteAlias($contents);

            if ($updated === null) {
                $warnings[] = 'Register the @admin-panel alias in the Vite configuration';
            } else {
                $contents = $updated;
                $completed[] = 'Registered the Admin Panel Vite alias';
            }
        }

        $this->files->replace($viteConfig, $contents);
    }

    private function addViteEntry(string $contents): ?string
    {
        $updated = preg_replace(
            '/^(\s*)input:\s*\[\s*$/m',
            "$0\n$1    '".self::VITE_ENTRY."',",
            $contents,
            1,
            $replacementCount,
        );

        if ($updated !== null && $replacementCount === 1) {
            return $updated;
        }

        $updated = preg_replace_callback(
            '/input:\s*\[(?<entries>[^\]]*)\]/s',
            fn (array $matches): string => sprintf(
                "input: [%s%s'%s']",
                $matches['entries'],
                trim($matches['entries']) === '' ? '' : ', ',
                self::VITE_ENTRY,
            ),
            $contents,
            1,
            $replacementCount,
        );

        return $updated !== null && $replacementCount === 1 ? $updated : null;
    }

    private function addInertiaVitePlugin(string $contents): ?string
    {
        $updated = preg_replace(
            '/^(\s*)plugins:\s*(?:lazyPlugins\(\(\)\s*=>\s*)?\[\s*$/m',
            "$0\n$1    inertia(),",
            $contents,
            1,
            $replacementCount,
        );

        if ($updated === null || $replacementCount !== 1) {
            return null;
        }

        if (! str_contains($updated, "from '@inertiajs/vite'")) {
            $updated = "import inertia from '@inertiajs/vite';\n".$updated;
        }

        return $updated;
    }

    private function addReactVitePlugin(string $contents): ?string
    {
        $updated = preg_replace(
            '/^(\s*)plugins:\s*(?:lazyPlugins\(\(\)\s*=>\s*)?\[\s*$/m',
            "$0\n$1    react(),",
            $contents,
            1,
            $replacementCount,
        );

        if ($updated === null || $replacementCount !== 1) {
            return null;
        }

        if (! str_contains($updated, "from '@vitejs/plugin-react'")) {
            $updated = "import react from '@vitejs/plugin-react';\n".$updated;
        }

        return $updated;
    }

    private function addTailwindVitePlugin(string $contents): ?string
    {
        $updated = preg_replace(
            '/^(\s*)plugins:\s*(?:lazyPlugins\(\(\)\s*=>\s*)?\[\s*$/m',
            "$0\n$1    tailwindcss(),",
            $contents,
            1,
            $replacementCount,
        );

        if ($updated === null || $replacementCount !== 1) {
            return null;
        }

        if (! str_contains($updated, "from '@tailwindcss/vite'")) {
            $updated = "import tailwindcss from '@tailwindcss/vite';\n".$updated;
        }

        return $updated;
    }

    private function addAdminPanelViteAlias(string $contents): ?string
    {
        $updated = preg_replace(
            '/^(\s*)plugins:\s*(?:lazyPlugins\(\(\)\s*=>\s*)?\[/m',
            <<<'CONFIG'
$1resolve: {
$1    preserveSymlinks: true,
$1    // pnpm nests packages under .pnpm; combined with preserveSymlinks this
$1    // yields two resolvable paths for React and breaks hooks in dev.
$1    dedupe: ['react', 'react-dom'],
$1    alias: {
$1        '@admin-panel': fileURLToPath(
$1            new URL('./vendor/parse/admin-panel/resources/js', import.meta.url),
$1        ),
$1    },
$1},
$0
CONFIG,
            $contents,
            1,
            $replacementCount,
        );

        if ($updated === null || $replacementCount !== 1) {
            return null;
        }

        if (! str_contains($updated, "from 'node:url'")) {
            $updated = "import { fileURLToPath, URL } from 'node:url';\n".$updated;
        }

        return $updated;
    }

    /**
     * @param  list<string>  $paths
     */
    private function firstExistingFile(array $paths): ?string
    {
        foreach ($paths as $path) {
            if ($this->files->exists($path)) {
                return $path;
            }
        }

        return null;
    }

    /**
     * @param  list<string>  $completed
     * @param  list<string>  $unchanged
     * @param  list<string>  $warnings
     */
    private function installTypeScriptSources(
        string $applicationPath,
        array &$completed,
        array &$unchanged,
        array &$warnings,
    ): void {
        $tsconfigPath = $applicationPath.'/tsconfig.json';

        if (! $this->files->exists($tsconfigPath)) {
            $unchanged[] = 'tsconfig.json was not found; TypeScript source inclusion was skipped';

            return;
        }

        $contents = $this->files->get($tsconfigPath);

        $sourcePattern = 'vendor/parse/admin-panel/resources/js/**/*';
        $pathsAreRegistered = str_contains($contents, '"@admin-panel/*"');

        if (! $pathsAreRegistered) {
            $updated = $this->addTypeScriptPaths($contents);

            if ($updated === null) {
                $warnings[] = 'Register the @admin-panel TypeScript paths in tsconfig.json';
            } else {
                $contents = $updated;
                $completed[] = 'Registered the Admin Panel TypeScript paths';
            }
        } else {
            $unchanged[] = 'Admin Panel TypeScript paths are already registered';
        }

        if (! str_contains($contents, $sourcePattern)) {
            $updated = preg_replace(
                '/^(\s*)"include":\s*\[\s*$/m',
                "$0\n$1    \"{$sourcePattern}.ts\",\n$1    \"{$sourcePattern}.tsx\",",
                $contents,
                1,
                $replacementCount,
            );

            if ($updated === null || $replacementCount !== 1) {
                $warnings[] = 'Include the Admin Panel resource directory in tsconfig.json';
            } else {
                $contents = $updated;
                $completed[] = 'Included the Admin Panel TypeScript sources';
            }
        } else {
            $unchanged[] = 'Admin Panel TypeScript sources are already included';
        }

        if ($contents !== $this->files->get($tsconfigPath)) {
            $this->files->replace($tsconfigPath, $contents);
        }
    }

    private function addTypeScriptPaths(string $contents): ?string
    {
        $paths = <<<'PATHS'
"@admin-panel": ["./vendor/parse/admin-panel/resources/js"],
"@admin-panel/*": ["./vendor/parse/admin-panel/resources/js/*"],
PATHS;

        $updated = preg_replace(
            '/^(\s*)"paths":\s*\{\s*$/m',
            "$0\n$1    {$paths}",
            $contents,
            1,
            $replacementCount,
        );

        if ($updated !== null && $replacementCount === 1) {
            return $updated;
        }

        $updated = preg_replace(
            '/^(\s*)"compilerOptions":\s*\{\s*$/m',
            "$0\n$1    \"paths\": {\n$1        {$paths}$1    },",
            $contents,
            1,
            $replacementCount,
        );

        return $updated !== null && $replacementCount === 1 ? $updated : null;
    }
}
