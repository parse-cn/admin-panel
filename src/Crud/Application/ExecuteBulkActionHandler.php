<?php

namespace Parse\AdminPanel\Crud\Application;

use Parse\AdminPanel\Crud\Application\Commands\ExecuteBulkActionCommand;
use Parse\AdminPanel\Crud\Contracts\CrudAuthorizer;
use Parse\AdminPanel\Crud\Contracts\CrudBulkActionRepository;
use Parse\AdminPanel\Crud\Contracts\TransactionManager;

final readonly class ExecuteBulkActionHandler
{
    public function __construct(
        private CrudAuthorizer $authorizer,
        private CrudBulkActionRepository $records,
        private TransactionManager $transactions,
    ) {}

    /** @return array{action: string, records: list<mixed>} */
    public function handle(ExecuteBulkActionCommand $command): array
    {
        $actor = $this->authorizer->authorize($command->resource, 'viewAny', $command->actor);
        $records = $this->records->findMany(
            $command->resource,
            $command->recordKeys,
            $command->context,
            $command->isWidget,
        );

        $this->transactions->transaction(
            function () use ($command, $records, $actor): void {
                $this->execute($command, $records, $actor);
            },
        );

        return ['action' => $command->action, 'records' => $records];
    }

    /** @param list<mixed> $records */
    private function execute(ExecuteBulkActionCommand $command, array $records, mixed $actor): void
    {
        $ability = $this->records->ability($command->resource, $command->action);

        foreach ($records as $record) {
            $this->authorizer->authorize($command->resource, $ability, $actor, $record);
        }

        $this->records->execute($command->resource, $command->action, $records, $actor);
    }
}
