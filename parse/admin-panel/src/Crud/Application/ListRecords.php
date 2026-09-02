<?php

namespace Parse\AdminPanel\Crud\Application;

use Parse\AdminPanel\Crud\Contracts\CrudListRepository;

final readonly class ListRecords
{
    public function __construct(private CrudListRepository $records) {}

    public function handle(ListRecordsQuery $query): mixed
    {
        return $this->records->paginate($query);
    }
}
