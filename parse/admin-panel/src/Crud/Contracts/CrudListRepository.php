<?php

namespace Parse\AdminPanel\Crud\Contracts;

use Parse\AdminPanel\Crud\Application\ListRecordsQuery;

interface CrudListRepository
{
    public function paginate(ListRecordsQuery $query): mixed;
}
