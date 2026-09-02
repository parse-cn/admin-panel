<?php

namespace Parse\AdminPanel\Crud\Http\Requests;

use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;
use Parse\AdminPanel\Crud\Definition\CrudResourceRegistry;
use Parse\AdminPanel\Crud\Infrastructure\Laravel\Resources\EloquentCrudResource as CrudResource;

final class ExecuteBulkActionRequest extends FormRequest
{
    private ?CrudResourceRegistry $resources = null;

    public function authorize(): bool
    {
        return true;
    }

    public function rules(CrudResourceRegistry $resources): array
    {
        $this->resources = $resources;

        return [
            'action' => ['required', 'string'],
            'keys' => ['required', 'array', 'min:1', 'max:100'],
            'keys.*' => ['required', 'distinct'],
            'context' => ['sometimes', 'array'],
        ];
    }

    /** @return list<callable(Validator): void> */
    public function after(): array
    {
        return [function (Validator $validator): void {
            if ($validator->errors()->isNotEmpty()) {
                return;
            }

            $resource = $this->resource();
            $user = $resource === null ? null : $resource::user($this);
            $action = $this->string('action')->toString();

            if (
                ! $resource
                || ! $user instanceof Authenticatable
                || ! collect($resource::bulkActions($user))->contains('key', $action)
            ) {
                $validator->errors()->add('action', 'The selected bulk action is unavailable.');
            }
        }];
    }

    /** @return class-string<CrudResource>|null */
    private function resource(): ?string
    {
        $resource = $this->route('resource');

        if (is_string($resource) && is_subclass_of($resource, CrudResource::class)) {
            return $resource;
        }

        return is_string($resource)
            ? $this->resources?->resolve($resource)
            : null;
    }
}
