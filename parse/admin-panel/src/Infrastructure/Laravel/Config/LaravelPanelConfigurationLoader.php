<?php

namespace Parse\AdminPanel\Infrastructure\Laravel\Config;

final class LaravelPanelConfigurationLoader
{
    /**
     * @return array<string, array<string, mixed>>
     */
    public function panels(): array
    {
        $panels = config('admin-panel.panels', []);

        if (! is_array($panels)) {
            return [];
        }

        return array_filter(
            $panels,
            static fn (mixed $configuration, mixed $id): bool => is_string($id) && is_array($configuration),
            ARRAY_FILTER_USE_BOTH,
        );
    }
}
