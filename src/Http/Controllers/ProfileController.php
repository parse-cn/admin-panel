<?php

namespace Parse\AdminPanel\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;
use Parse\AdminPanel\Http\Requests\UpdatePasswordRequest;
use Parse\AdminPanel\Http\Requests\UpdateProfileRequest;
use Parse\AdminPanel\Infrastructure\Laravel\Panel\PanelManager;

final class ProfileController extends Controller
{
    public function show(Request $request, PanelManager $panels): Response
    {
        return $this->accountTab($request, $panels, 'profile');
    }

    public function preferences(Request $request, PanelManager $panels): Response
    {
        return $this->accountTab($request, $panels, 'preferences');
    }

    public function security(Request $request, PanelManager $panels): Response
    {
        return $this->accountTab($request, $panels, 'security');
    }

    public function update(UpdateProfileRequest $request, PanelManager $panels): RedirectResponse
    {
        $panel = $panels->current($request);
        $user = $request->user($panel->guard);
        abort_unless($user !== null, 403);
        $attributes = $request->validated();

        $updates = [
            'name' => $attributes['name'] ?? null,
            'email' => $attributes['email'] ?? null,
        ];

        if (array_key_exists('avatar', $attributes)) {
            $updates['avatar'] = $attributes['avatar'] ?: $user->getRawOriginal('avatar');
        }

        $user->forceFill($updates)->save();

        return to_route($panel->route('profile'))->with('toast', [
            'type' => 'success',
            'message' => __('admin-panel::messages.account.profile_page.saved'),
        ]);
    }

    public function updatePassword(UpdatePasswordRequest $request, PanelManager $panels): RedirectResponse
    {
        $panel = $panels->current($request);
        $user = $request->user($panel->guard);
        abort_unless($user !== null, 403);
        $user->forceFill(['password' => $request->validated('password')])->save();
        Auth::guard($panel->guard)->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return to_route($panel->route('login'));
    }

    private function accountTab(Request $request, PanelManager $panels, string $activeTab): Response
    {
        $panel = $panels->current($request);
        $user = $request->user($panel->guard);
        abort_unless($user !== null, 403);
        $avatarUpload = $panel->profileAvatarUpload();

        return Inertia::render($activeTab === 'profile' ? 'profile' : "profile/{$activeTab}", [
            'profile' => ['name' => $user->name, 'email' => $user->email],
            'profileUpdateUrl' => route($panel->route('profile.update')),
            'passwordUpdateUrl' => route($panel->route('profile.password.update')),
            'avatarUploadUrl' => $avatarUpload === null
                ? null
                : route($panel->route('uploads.store'), ['purpose' => $avatarUpload['purpose']]),
            'activeTab' => $activeTab,
            'tabUrls' => [
                'profile' => route($panel->route('profile')),
                'preferences' => route($panel->route('profile.preferences')),
                'security' => route($panel->route('profile.security')),
            ],
            'translations' => __('admin-panel::messages.account.profile_page'),
        ]);
    }
}
