<?php

namespace Parse\AdminPanel\Domain\Panel;

use InvalidArgumentException;

final readonly class PanelId
{
    public function __construct(public string $value)
    {
        if ($value === '' || preg_match('/^[A-Za-z0-9][A-Za-z0-9_-]*$/', $value) !== 1) {
            throw new InvalidArgumentException("Invalid admin panel id [{$value}].");
        }
    }

    public function __toString(): string
    {
        return $this->value;
    }
}
