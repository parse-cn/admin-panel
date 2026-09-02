<?php

namespace Parse\AdminPanel\Infrastructure\Laravel\Panel;

use Illuminate\Http\Request;

interface SharesPanelProps
{
    /**
     * @return array<string, mixed>
     */
    public function share(Request $request, PanelRuntime $panel): array;
}
