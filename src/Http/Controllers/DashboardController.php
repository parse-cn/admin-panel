<?php

namespace Parse\AdminPanel\Http\Controllers;

use Illuminate\Routing\Controller;
use Inertia\Inertia;
use Inertia\Response;

final class DashboardController extends Controller
{
    public function __invoke(): Response
    {
        return Inertia::render('dashboard');
    }
}
