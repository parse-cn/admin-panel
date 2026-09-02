<?php

namespace Parse\AdminPanel\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Parse\AdminPanel\Infrastructure\Laravel\Panel\PanelManager;

final class StoreUploadRequest extends FormRequest
{
    public function authorize(PanelManager $panels): bool
    {
        $panel = $panels->current($this);

        return $this->user($panel->guard) !== null;
    }

    /**
     * @return array<string, list<mixed>>
     */
    public function rules(PanelManager $panels): array
    {
        $purpose = $this->route('purpose');
        abort_unless(is_string($purpose), 404);

        $panel = $panels->current($this);
        abort_unless($panel->hasUpload($purpose), 404);

        return [
            'file' => $panel->registeredUpload($purpose)->rules,
        ];
    }
}
