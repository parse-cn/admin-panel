<?php

namespace Parse\AdminPanel\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Parse\AdminPanel\Infrastructure\Laravel\Panel\PanelManager;
use Parse\AdminPanel\Infrastructure\Laravel\Panel\PanelRuntime;

final class UpdateProfileRequest extends FormRequest
{
    public function authorize(PanelManager $panels): bool
    {
        $panel = $panels->current($this);

        return $this->user($panel->guard) !== null;
    }

    /** @return array<string, list<ValidationRule|string>> */
    public function rules(PanelManager $panels): array
    {
        $panel = $panels->current($this);
        $user = $this->user($panel->guard);
        abort_unless($user !== null, 403);
        $rules = [
            'name' => ['required', 'string', 'max:255'],
            'email' => [
                'required',
                'email',
                'max:255',
                Rule::unique($user->getTable(), 'email')->ignore($user->getKey()),
            ],
        ];

        if ($this->profileHasAvatar($panel)) {
            $rules['avatar'] = [
                'nullable',
                'string',
                'max:255',
                function (string $attribute, mixed $value, \Closure $fail) use ($panel): void {
                    if (! is_string($value) || $value === '') {
                        return;
                    }

                    $upload = $panel->profileAvatarUpload();
                    $prefix = rtrim(($upload['directory'])($this), '/').'/';

                    if (! str_starts_with($value, $prefix)) {
                        $fail(__('admin-panel::messages.account.profile_page.invalid_avatar'));
                    }
                },
            ];
        }

        return $rules;
    }

    private function profileHasAvatar(PanelRuntime $panel): bool
    {
        return $panel->profileAvatarUpload() !== null;
    }
}
