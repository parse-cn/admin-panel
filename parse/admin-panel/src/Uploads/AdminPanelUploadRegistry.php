<?php

namespace Parse\AdminPanel\Uploads;

use Closure;
use Illuminate\Http\Request;
use InvalidArgumentException;

final class AdminPanelUploadRegistry
{
    /**
     * @var array<string, RegisteredUpload>
     */
    private array $uploads = [];

    /**
     * @param  callable(Request): string  $directory
     * @param  list<mixed>  $rules
     */
    public function register(
        string $purpose,
        string $disk,
        callable $directory,
        array $rules,
    ): void {
        if (preg_match('/^[a-z0-9]+(?:-[a-z0-9]+)*$/', $purpose) !== 1) {
            throw new InvalidArgumentException(
                'Admin panel upload purpose must use kebab-case.',
            );
        }

        if ($disk === '') {
            throw new InvalidArgumentException('Admin panel upload disk must not be empty.');
        }

        if ($rules === []) {
            throw new InvalidArgumentException('Admin panel upload rules must not be empty.');
        }

        if (isset($this->uploads[$purpose])) {
            throw new InvalidArgumentException(
                "Admin panel upload [{$purpose}] is already registered.",
            );
        }

        $this->uploads[$purpose] = new RegisteredUpload(
            purpose: $purpose,
            disk: $disk,
            directory: Closure::fromCallable($directory),
            rules: $rules,
        );
    }

    public function get(string $purpose): RegisteredUpload
    {
        return $this->uploads[$purpose]
            ?? throw new InvalidArgumentException(
                "Admin panel upload [{$purpose}] is not registered.",
            );
    }

    public function has(string $purpose): bool
    {
        return isset($this->uploads[$purpose]);
    }
}
