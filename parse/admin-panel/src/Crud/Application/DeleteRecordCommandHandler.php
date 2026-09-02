<?php

namespace Parse\AdminPanel\Crud\Application;

use Parse\AdminPanel\Crud\Application\Commands\DeleteRecordCommand;
use Parse\AdminPanel\Crud\Contracts\CrudAuthorizer;
use Parse\AdminPanel\Crud\Contracts\CrudRecordRepository;
use Parse\AdminPanel\Crud\Contracts\TransactionManager;

final readonly class DeleteRecordCommandHandler
{
    public function __construct(
        private CrudAuthorizer $authorizer,
        private CrudRecordRepository $records,
        private TransactionManager $transactions,
    ) {}

    public function handle(DeleteRecordCommand $command): void
    {
        $resource = $command->resource;

        if (! $resource::canDelete()) {
            throw new \InvalidArgumentException("CRUD resource [{$command->resource}] does not allow deletion.");
        }

        $record = $this->records->find(
            $command->resource,
            $command->recordKey,
            $command->context,
            $command->isWidget,
        );
        $this->authorizer->authorize($command->resource, 'delete', $command->actor, $record);

        $this->transactions->transaction(
            function () use ($command, $record): void {
                $this->records->delete($command->resource, $record, $command->actor);
            },
        );
    }
}
