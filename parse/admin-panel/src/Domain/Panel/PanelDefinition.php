<?php

namespace Parse\AdminPanel\Domain\Panel;

final readonly class PanelDefinition
{
    public PanelId $panelId;

    public function __construct(
        public string $id,
        public ?string $domain,
        public ?string $prefix,
    ) {
        $this->panelId = new PanelId($id);
    }
}
