<?php

namespace Parse\AdminPanel\Http\Responses;

use Illuminate\Auth\AuthenticationException;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\ResponseFactory;
use InvalidArgumentException;
use Parse\AdminPanel\Infrastructure\Laravel\Panel\PanelManager;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
use Throwable;

final readonly class RenderPanelError
{
    public function __construct(private PanelManager $panels) {}

    public function __invoke(Throwable $exception, Request $request): ?Response
    {
        if ($request->expectsJson() || ! $request->isMethod('GET')) {
            return null;
        }

        $status = $exception instanceof HttpExceptionInterface ? $exception->getStatusCode() : 500;
        if (! in_array($status, [403, 404, 500], true)
            || ($status === 500 && config('app.debug'))
            || $exception instanceof AuthenticationException
            || $exception instanceof ValidationException
            || $exception instanceof HttpResponseException) {
            return null;
        }

        try {
            $panel = $this->panels->current($request);
        } catch (InvalidArgumentException) {
            return null;
        }

        $cookieLocale = $request->cookie($panel->localeCookieName());
        $locale = is_string($cookieLocale) && array_key_exists($cookieLocale, $panel->supportedLocales)
            ? $cookieLocale : $panel->defaultLocale;

        // Error rendering must not evaluate navigation or shared props that may have failed.
        $inertia = new ResponseFactory;
        $inertia->setRootView('admin-panel::inertia');
        $response = $inertia->render('error', [
            'status' => $status,
            'homeUrl' => route($panel->route('dashboard')),
            'messages' => trans('admin-panel::messages.errors', [], $locale),
        ])->toResponse($request);

        if ($exception instanceof HttpExceptionInterface) {
            $response->headers->add($exception->getHeaders());
        }

        return $response->setStatusCode($status);
    }
}
