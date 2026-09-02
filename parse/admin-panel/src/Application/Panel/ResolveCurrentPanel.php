<?php

namespace Parse\AdminPanel\Application\Panel;

use InvalidArgumentException;
use Parse\AdminPanel\Domain\Panel\PanelDefinition;
use Parse\AdminPanel\Domain\Panel\PanelMatcher;
use Parse\AdminPanel\Domain\Panel\PanelRegistry;

final readonly class ResolveCurrentPanel
{
    public function __construct(
        private PanelRegistry $panels,
        private PanelMatcher $matcher,
    ) {}

    public function execute(string $host, string $path): PanelDefinition
    {
        $panel = $this->matcher->match($this->panels->all(), $host, $path);

        if ($panel === null) {
            throw new InvalidArgumentException('The current request does not resolve to exactly one admin panel.');
        }

        return $panel;
    }
}
