<?php

namespace Parse\AdminPanel\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

final class GlobalSearchRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, list<string>>
     */
    public function rules(): array
    {
        return [
            'query' => ['required', 'string', 'min:2', 'max:100'],
        ];
    }

    public function searchTerm(): string
    {
        return $this->string('query')->trim()->toString();
    }
}
