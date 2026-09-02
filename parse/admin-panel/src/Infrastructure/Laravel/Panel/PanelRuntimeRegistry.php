<?php

namespace Parse\AdminPanel\Infrastructure\Laravel\Panel;

use InvalidArgumentException;

final class PanelRuntimeRegistry
{
    /** @var array<string, PanelRuntime> */
    private array $panels = [];

    public function register(PanelRuntime $panel): PanelRuntime
    {
        if (isset($this->panels[$panel->id])) {
            throw new InvalidArgumentException("Admin panel [{$panel->id}] is already registered.");
        }

        return $this->panels[$panel->id] = $panel;
    }

    public function panel(string $id): PanelRuntime
    {
        return $this->panels[$id]
            ?? throw new InvalidArgumentException("Admin panel [{$id}] is not registered.");
    }

    /** @return list<PanelRuntime> */
    public function all(): array
    {
        return array_values($this->panels);
    }
}
