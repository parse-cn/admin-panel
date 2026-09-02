<?php

namespace Parse\AdminPanel\Domain\Panel;

use InvalidArgumentException;

final class PanelRegistry
{
    /** @var array<string, PanelDefinition> */
    private array $panels = [];

    public function register(PanelDefinition $panel): PanelDefinition
    {
        if (isset($this->panels[$panel->id])) {
            throw new InvalidArgumentException("Admin panel [{$panel->id}] is already registered.");
        }

        return $this->panels[$panel->id] = $panel;
    }

    public function panel(string $id): PanelDefinition
    {
        return $this->panels[$id]
            ?? throw new InvalidArgumentException("Admin panel [{$id}] is not registered.");
    }

    /** @return list<PanelDefinition> */
    public function all(): array
    {
        return array_values($this->panels);
    }
}
