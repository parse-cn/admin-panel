import { Head, Link } from '@inertiajs/react';
import {
    ArrowLeftIcon,
    Building2Icon,
    PencilIcon,
    Trash2Icon,
} from 'lucide-react';
import { Frame, FrameHeader, FramePanel, FrameTitle } from '@admin-panel/ui';
import { Button } from '@admin-panel/ui';
import { useCrudI18n } from '../../i18n/crud-i18n';
import { preserveCurrentQuery } from '../../lib/preserve-query';
import { CrudCell } from './crud-cell';
import { DeleteRecordDialog } from './delete-record-dialog';
import type {
    CrudColumn,
    CrudDefinition,
    CrudRecord,
    CrudRoutes,
} from './types';

export type CrudShowProps = {
    resource: CrudDefinition;
    record: CrudRecord;
    routes: CrudRoutes;
};

function DetailRow({
    column,
    record,
}: {
    column: CrudColumn;
    record: CrudRecord;
}) {
    return (
        <div className="grid gap-1 px-5 py-4 sm:grid-cols-[11rem_1fr] sm:gap-8">
            <dt className="text-sm text-muted-foreground">{column.label}</dt>
            <dd className="min-w-0 text-sm text-foreground">
                <CrudCell
                    column={column}
                    record={record}
                    value={record.values[column.name]}
                />
            </dd>
        </div>
    );
}

export function CrudShow({
    resource,
    record,
    routes,
    presentation = 'page',
}: CrudShowProps & { presentation?: 'page' | 'sheet' }) {
    const { t } = useCrudI18n();
    const name = record.title;
    const statusColumn = resource.columns.find(
        (column) => column.name === 'status',
    );
    const metadataColumns = resource.columns.filter(
        (column) => column.type === 'datetime',
    );
    const detailColumns = resource.columns.filter(
        (column) => column.type !== 'datetime',
    );
    const isSheet = presentation === 'sheet';
    const hasActions = Boolean(routes.destroy || routes.edit);
    const actions = hasActions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2">
            {routes.destroy && (
                <DeleteRecordDialog
                    deleteUrl={routes.destroy}
                    recordName={name}
                    resourceLabel={resource.singularLabel}
                    trigger={
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                        >
                            <Trash2Icon aria-hidden="true" />
                            {t('crud.show.delete', {
                                resource: resource.singularLabel,
                            })}
                        </Button>
                    }
                />
            )}
            {routes.edit && (
                <Button
                    nativeButton={false}
                    render={<Link href={routes.edit} />}
                    size="sm"
                >
                    <PencilIcon aria-hidden="true" />
                    {t('crud.show.edit', {
                        resource: resource.singularLabel,
                    })}
                </Button>
            )}
        </div>
    ) : null;
    const details = (
        <dl className="divide-y divide-border">
            {detailColumns.map((column) => (
                <DetailRow column={column} record={record} key={column.name} />
            ))}
            <div className="grid gap-1 px-5 py-4 sm:grid-cols-[11rem_1fr] sm:gap-8">
                <dt className="text-sm text-muted-foreground">
                    {t('crud.show.record_id')}
                </dt>
                <dd className="min-w-0 font-mono text-xs break-all text-foreground">
                    {String(record.key)}
                </dd>
            </div>
            {metadataColumns.map((column) => (
                <DetailRow column={column} record={record} key={column.name} />
            ))}
        </dl>
    );

    return (
        <>
            {presentation === 'page' && <Head title={name} />}

            <div
                className={
                    isSheet
                        ? 'flex min-h-0 w-full flex-1 flex-col gap-0 overflow-y-auto'
                        : 'flex w-full flex-col gap-6'
                }
            >
                {presentation === 'page' && (
                    <Link
                        className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
                        href={preserveCurrentQuery(routes.index)}
                    >
                        <ArrowLeftIcon className="size-4" aria-hidden="true" />
                        {t('crud.show.back_to', { resource: resource.title })}
                    </Link>
                )}

                <header
                    className={
                        isSheet
                            ? 'flex shrink-0 items-start justify-between gap-4 border-b border-border px-5 py-4 pr-16 sm:px-6'
                            : 'flex flex-col justify-between gap-4 border-b border-border pb-6 sm:flex-row sm:items-center'
                    }
                >
                    <div
                        className={
                            isSheet
                                ? 'flex min-w-0 flex-col gap-1'
                                : 'flex min-w-0 items-center gap-4'
                        }
                    >
                        {!isSheet && (
                            <div className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-border bg-muted text-muted-foreground shadow-xs">
                                <Building2Icon
                                    className="size-6"
                                    aria-hidden="true"
                                />
                            </div>
                        )}
                        <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                                <h1
                                    className={
                                        isSheet
                                            ? 'truncate text-lg font-semibold tracking-tight'
                                            : 'truncate text-2xl font-semibold tracking-tight'
                                    }
                                >
                                    {name}
                                </h1>
                                {statusColumn && (
                                    <CrudCell
                                        column={statusColumn}
                                        value={record.values.status}
                                    />
                                )}
                            </div>
                            <p
                                className={
                                    isSheet
                                        ? 'truncate text-sm text-muted-foreground'
                                        : 'mt-1 truncate text-sm text-muted-foreground'
                                }
                            >
                                {t('crud.show.record_summary', {
                                    resource: resource.singularLabel,
                                    id: String(record.key),
                                })}
                            </p>
                        </div>
                    </div>

                    {!isSheet && actions}
                </header>

                <div className={isSheet ? 'px-5 py-4 sm:px-6' : undefined}>
                    {isSheet ? (
                        details
                    ) : (
                        <Frame
                            variant="default"
                            spacing="sm"
                            className="w-full"
                        >
                            <FrameHeader>
                                <FrameTitle id="details-heading">
                                    {t('crud.show.details')}
                                </FrameTitle>
                            </FrameHeader>
                            <FramePanel
                                className="bg-card p-0! shadow-none!"
                                aria-labelledby="details-heading"
                            >
                                {details}
                            </FramePanel>
                        </Frame>
                    )}
                </div>

                {isSheet && actions && (
                    <footer className="mt-auto flex shrink-0 justify-end border-t bg-muted/60 px-5 py-4 sm:px-6">
                        <div>{actions}</div>
                    </footer>
                )}
            </div>
        </>
    );
}
