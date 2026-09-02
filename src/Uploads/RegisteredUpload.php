<?php

namespace Parse\AdminPanel\Uploads;

use Closure;
use Illuminate\Http\Request;

final readonly class RegisteredUpload
{
    /**
     * @param  Closure(Request): string  $directory
     * @param  list<mixed>  $rules
     */
    public function __construct(
        public string $purpose,
        public string $disk,
        public Closure $directory,
        public array $rules,
    ) {}
}
