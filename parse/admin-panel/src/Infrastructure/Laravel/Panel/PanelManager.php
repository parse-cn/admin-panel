<?php

namespace Parse\AdminPanel\Infrastructure\Laravel\Panel;

use Illuminate\Http\Request;
use Parse\AdminPanel\Application\Panel\ResolveCurrentPanel;

final readonly class PanelManager
{
    public function __construct(
        private LaravelPanelFactory $definitions,
        private PanelRuntimeRegistry $panels,
        private ResolveCurrentPanel $resolveCurrentPanel,
    ) {}

    /** @param array<string, mixed> $configuration */
    public function register(string $id, array $configuration): PanelRuntime
    {
        return $this->definitions->create($id, $configuration);
    }

    public function panel(string $id): PanelRuntime
    {
        return $this->panels->panel($id);
    }

    public function current(Request $request): PanelRuntime
    {
        $panel = $request->attributes->get('admin_panel');

        if ($panel instanceof PanelRuntime) {
            return $panel;
        }

        $definition = $this->resolveCurrentPanel->execute(
            host: $request->host(),
            path: $request->path(),
        );
        $panel = $this->panels->panel($definition->id);
        $request->attributes->set('admin_panel', $panel);

        return $panel;
    }

    /** @return list<PanelRuntime> */
    public function panels(): array
    {
        return $this->panels->all();
    }
}
