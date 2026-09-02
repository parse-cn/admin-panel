<?php

namespace Parse\AdminPanel\Resources\Details;

use Closure;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;

final readonly class Detail
{
    /** @param Closure(Request, Model): bool|null $pageWhen */
    private function __construct(
        private DetailPresentation $presentation,
        private ?Closure $pageWhen = null,
    ) {}

    public static function make(): self
    {
        return new self(DetailPresentation::Sheet);
    }

    public function asPage(): self
    {
        return new self(DetailPresentation::Page);
    }

    /** @param Closure(Request, Model): bool $condition */
    public function asPageWhen(Closure $condition): self
    {
        return new self($this->presentation, $condition);
    }

    public function isPage(Request $request, Model $record): bool
    {
        return $this->pageWhen !== null
            ? (bool) ($this->pageWhen)($request, $record)
            : $this->presentation === DetailPresentation::Page;
    }
}
