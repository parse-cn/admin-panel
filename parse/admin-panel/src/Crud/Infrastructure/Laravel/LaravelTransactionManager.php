<?php

namespace Parse\AdminPanel\Crud\Infrastructure\Laravel;

use Illuminate\Support\Facades\DB;
use Parse\AdminPanel\Crud\Contracts\TransactionManager;

final class LaravelTransactionManager implements TransactionManager
{
    public function transaction(\Closure $operation): mixed
    {
        return DB::transaction($operation);
    }
}
