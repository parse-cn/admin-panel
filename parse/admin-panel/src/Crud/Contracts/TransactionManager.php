<?php

namespace Parse\AdminPanel\Crud\Contracts;

interface TransactionManager
{
    public function transaction(\Closure $operation): mixed;
}
