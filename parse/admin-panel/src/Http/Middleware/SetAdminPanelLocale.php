<?php

namespace Parse\AdminPanel\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\App;
use Parse\AdminPanel\Infrastructure\Laravel\Panel\PanelManager;
use Symfony\Component\HttpFoundation\Response;

final class SetAdminPanelLocale
{
    public function __construct(
        private readonly PanelManager $panels,
    ) {}

    public function handle(Request $request, Closure $next): Response
    {
        $panel = $this->panels->current($request);
        $previousLocale = App::currentLocale();
        $previousFallbackLocale = App::getFallbackLocale();
        $cookieLocale = $request->cookie($panel->localeCookieName());
        $locale = is_string($cookieLocale)
            && array_key_exists($cookieLocale, $panel->supportedLocales)
                ? $cookieLocale
                : $panel->defaultLocale;

        App::setLocale($locale);
        App::setFallbackLocale($panel->fallbackLocale);

        try {
            return $next($request);
        } finally {
            App::setLocale($previousLocale);
            App::setFallbackLocale($previousFallbackLocale);
        }
    }
}
