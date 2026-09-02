<?php

namespace Parse\AdminPanel\Crud\Application;

use Parse\AdminPanel\Crud\Application\Commands\UpdateRecordCommand;
use Parse\AdminPanel\Crud\Contracts\CrudAuthorizer;
use Parse\AdminPanel\Crud\Contracts\CrudRecordRepository;
use Parse\AdminPanel\Crud\Contracts\CrudValidator;
use Parse\AdminPanel\Crud\Contracts\TransactionManager;

final readonly class UpdateRecordCommandHandler
{
    public function __construct(
        private CrudAuthorizer $authorizer,
        private CrudRecordRepository $records,
        private CrudValidator $validator,
        private TransactionManager $transactions,
    ) {}

    public function handle(UpdateRecordCommand $command): mixed
    {
        $record = $this->records->find(
            $command->resource,
            $command->recordKey,
            $command->context,
            $command->isWidget,
        );
        $actor = $this->authorizer->authorize($command->resource, 'update', $command->actor, $record);
        $attributes = $this->validator->validate($command->resource, $command->attributes, $record);

        return $this->transactions->transaction(
            fn (): mixed => $this->records->update($command->resource, $record, $attributes),
        );
    }
}
