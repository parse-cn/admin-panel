<?php

namespace Parse\AdminPanel\Domain\Panel;

final class PanelMatcher
{
    /**
     * @param  list<PanelDefinition>  $panels
     */
    public function match(array $panels, string $host, string $path): ?PanelDefinition
    {
        $matches = array_values(array_filter(
            $panels,
            fn (PanelDefinition $panel): bool => $this->matches($panel, $host, $path),
        ));

        return count($matches) === 1 ? $matches[0] : null;
    }

    private function matches(PanelDefinition $panel, string $host, string $path): bool
    {
        if ($panel->domain !== null && strtolower($panel->domain) !== strtolower($this->normalizeHost($host))) {
            return false;
        }

        if ($panel->prefix === null) {
            return true;
        }

        $prefix = trim($panel->prefix, '/');
        $normalizedPath = trim(parse_url($path, PHP_URL_PATH) ?: $path, '/');

        return $normalizedPath === $prefix || str_starts_with($normalizedPath, "{$prefix}/");
    }

    private function normalizeHost(string $host): string
    {
        return strtolower((string) (parse_url(str_contains($host, '://') ? $host : "//{$host}", PHP_URL_HOST) ?: $host));
    }
}
