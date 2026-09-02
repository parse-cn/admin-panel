<?php

namespace Parse\AdminPanel\Installation;

final readonly class AdminPanelInstallResult
{
    /**
     * @param  list<string>  $completed
     * @param  list<string>  $unchanged
     * @param  list<string>  $warnings
     */
    public function __construct(
        public array $completed,
        public array $unchanged,
        public array $warnings,
    ) {}
}
