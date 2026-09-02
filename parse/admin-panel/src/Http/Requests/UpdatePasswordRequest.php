<?php

namespace Parse\AdminPanel\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;
use Parse\AdminPanel\Infrastructure\Laravel\Panel\PanelManager;

final class UpdatePasswordRequest extends FormRequest
{
    public function authorize(PanelManager $panels): bool
    {
        $panel = $panels->current($this);

        return $this->user($panel->guard) !== null;
    }

    /** @return array<string, list<string>> */
    public function rules(PanelManager $panels): array
    {
        $panel = $panels->current($this);

        return [
            'current_password' => ['required', "current_password:{$panel->guard}"],
            'password' => ['required', 'confirmed', Password::defaults()],
        ];
    }
}
