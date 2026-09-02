<?php

namespace Parse\AdminPanel\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Cookie;
use Parse\AdminPanel\Http\Requests\UpdateLocaleRequest;
use Parse\AdminPanel\Infrastructure\Laravel\Panel\PanelManager;

final class LocaleController extends Controller
{
    public function __construct(
        private readonly PanelManager $panels,
    ) {}

    public function update(UpdateLocaleRequest $request): RedirectResponse
    {
        $panel = $this->panels->current($request);
        $locale = $request->string('locale')->toString();

        return back()->withCookie(Cookie::make(
            name: $panel->localeCookieName(),
            value: $locale,
            minutes: 60 * 24 * 365,
        ));
    }
}
