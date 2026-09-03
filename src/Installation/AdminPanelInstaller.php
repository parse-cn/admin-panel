<?php

namespace Parse\AdminPanel\Installation;

use Illuminate\Filesystem\Filesystem;
use JsonException;

final readonly class AdminPanelInstaller
{
    private const string VITE_ENTRY = 'vendor/parse/admin-panel/resources/js/app.tsx';

    /**
     * @var array<string, string>
     */
    private const array DEPENDENCIES = [
        '@base-ui/react' => '^1.6.0',
        '@dnd-kit/core' => '^6.3.1',
        '@dnd-kit/modifiers' => '^9.0.0',
        '@dnd-kit/sortable' => '^10.0.0',
        '@dnd-kit/utilities' => '^3.2.2',
        '@inertiajs/react' => '^3.0.0',
        '@tanstack/react-table' => '^8.21.3',
        '@tanstack/react-virtual' => '^3.14.10',
        'class-variance-authority' => '^0.7.1',
        'clsx' => '^2.1.1',
        'date-fns' => '^4.4.0',
        'lucide-react' => '^1.25.0',
        'react' => '^19.2.0',
        'react-day-picker' => '^10.0.1',
        'react-dom' => '^19.2.0',
        'recharts' => '^3.10.1',
        'sonner' => '^2.0.8',
        'tailwind-merge' => '^3.0.1',
        'tw-animate-css' => '^1.4.0',
    ];

    /**
     * @var array<string, string>
     */
    private const array DEV_DEPENDENCIES = [
        '@laravel/vite-plugin-wayfinder' => '^0.1.3',
        '@inertiajs/vite' => '^3.0.0',
        '@tailwindcss/vite' => '^4.1.11',
        '@types/react' => '^19.2.0',
        '@types/react-dom' => '^19.2.0',
        '@vitejs/plugin-react' => '^5.2.0',
        'tailwindcss' => '^4.0.0',
        'typescript' => '^5.7.2',
        'vite' => '^8.0.0',
    ];

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

        $dependenciesChanged = $this->mergeDependencies(
            $manifest,
            'dependencies',
            self::DEPENDENCIES,
        );
        $devDependenciesChanged = $this->mergeDependencies(
            $manifest,
            'devDependencies',
            self::DEV_DEPENDENCIES,
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
        $entryWasRegistered = str_contains($contents, '/admin-panel/resources/js/app.tsx');

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

    private function addAdminPanelViteAlias(string $contents): ?string
    {
        $updated = preg_replace(
            '/^(\s*)plugins:\s*(?:lazyPlugins\(\(\)\s*=>\s*)?\[/m',
            <<<'CONFIG'
$1resolve: {
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
