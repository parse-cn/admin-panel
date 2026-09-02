<?php

namespace Parse\AdminPanel\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Parse\AdminPanel\Infrastructure\Laravel\Panel\PanelManager;

final class UpdateLocaleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, list<mixed>>
     */
    public function rules(PanelManager $panels): array
    {
        $panel = $panels->current($this);

        return [
            'locale' => [
                'required',
                'string',
                Rule::in(array_keys($panel->supportedLocales)),
            ],
        ];
    }
}
