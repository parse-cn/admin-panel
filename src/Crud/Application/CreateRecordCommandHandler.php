<?php

namespace Parse\AdminPanel\Crud\Application;

use Parse\AdminPanel\Crud\Application\Commands\CreateRecordCommand;
use Parse\AdminPanel\Crud\Contracts\CrudAuthorizer;
use Parse\AdminPanel\Crud\Contracts\CrudRecordRepository;
use Parse\AdminPanel\Crud\Contracts\CrudValidator;
use Parse\AdminPanel\Crud\Contracts\TransactionManager;

final readonly class CreateRecordCommandHandler
{
    public function __construct(
        private CrudAuthorizer $authorizer,
        private CrudRecordRepository $records,
        private CrudValidator $validator,
        private TransactionManager $transactions,
    ) {}

    public function handle(CreateRecordCommand $command): mixed
    {
        $actor = $this->authorizer->authorize($command->resource, 'create', $command->actor);
        $attributes = $this->validator->validate($command->resource, $command->attributes);

        return $this->transactions->transaction(
            fn (): mixed => $this->records->create($command->resource, $attributes, $actor),
        );
    }
}
