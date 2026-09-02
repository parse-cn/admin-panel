import { useHttp, usePage } from '@inertiajs/react';
import { useState } from 'react';
import type { ReactNode } from 'react';
import { AlertDialog, Sheet, SheetContent } from '@admin-panel/ui';
import { useCrudData } from '../../hooks/use-crud-data';
import type { CrudWidgetContextValue } from '../../hooks/use-crud-data';
import { DataGridView } from '../data-grid/data-grid-view';
import { serializeFilters } from '../data-grid/use-data-grid-query';
import { DeleteRecordDialogContent } from './delete-record-dialog';
import { CrudForm } from './crud-form';
import { CrudShow } from './crud-show';
import type { CrudRecord, CrudRecordAction } from './types';

type WidgetMode = 'modal' | 'drawer' | 'inline';

export type CrudWidgetConfig = {
    mode?: 'inline';
    pageSize?: number;
    showSearch?: boolean;
    showFilters?: boolean;
    showPagination?: boolean;
    showBulkActions?: boolean;
    showRowActions?: boolean;
    createMode?: WidgetMode;
    editMode?: WidgetMode;
    showMode?: 'drawer';
    stateMode?: 'url';
    stateKey?: string;
};

export type CrudWidgetProps = {
    resource: string;
    context?: Record<string, CrudWidgetContextValue>;
    config?: CrudWidgetConfig;
    endpoint?: string;
    headerActions?: ReactNode;
    onCreated?: (record: CrudRecord) => void;
    onDeleted?: (record: CrudRecord) => void;
};

type PageProps = { panel?: { crudWidgetUrl?: string } };

type CrudWidgetBulkRequest = {
    action: string;
    context: Record<string, CrudWidgetContextValue>;
    keys: Array<string | number>;
};

type CrudWidgetBulkResponse = {
    action: string;
    count: number;
};

const widgetSheetClassName =
    'flex flex-col gap-0 overflow-hidden rounded-xl p-0 outline-none data-[side=right]:inset-y-4 data-[side=right]:right-4 data-[side=right]:left-auto data-[side=right]:h-[calc(100svh-2rem)] data-[side=right]:w-[min(64rem,calc(100vw-2rem))] data-[side=right]:max-w-none data-[side=right]:sm:max-w-none';

function endpointFor(
    resource: string,
    endpoint: string | undefined,
    template: string | undefined,
): string {
    if (endpoint) {
        return endpoint;
    }

    return (template ?? '/crud/__resource__/data').replace(
        '__resource__',
        encodeURIComponent(resource),
    );
}

function withContext(
    url: string,
    context: Record<string, CrudWidgetContextValue>,
): string {
    const query = new URLSearchParams();

    Object.entries(context).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
            query.set(`context[${key}]`, String(value));
        }
    });

    return query.toString() === ''
        ? url
        : `${url}${url.includes('?') ? '&' : '?'}${query.toString()}`;
}

export function CrudWidget({
    resource,
    context = {},
    config = {},
    endpoint,
    headerActions,
    onCreated,
    onDeleted,
}: CrudWidgetProps) {
    const { props } = usePage<PageProps>();
    const dataUrl = endpointFor(resource, endpoint, props.panel?.crudWidgetUrl);
    const { data, refresh } = useCrudData(dataUrl, context);
    const mutation = useHttp<
        Record<string, CrudWidgetContextValue>,
        { record?: CrudRecord }
    >({});
    const bulkMutation = useHttp<CrudWidgetBulkRequest, CrudWidgetBulkResponse>(
        {
            action: '',
            context,
            keys: [],
        },
    );
    const [formRecord, setFormRecord] = useState<CrudRecord | null | undefined>(
        undefined,
    );
    const [activeRecord, setActiveRecord] = useState<CrudRecord | null>(null);
    const [recordToDelete, setRecordToDelete] = useState<CrudRecord | null>(
        null,
    );
    const definition = data?.resource;

    function openForm(record: CrudRecord | null) {
        mutation.clearErrors();
        setFormRecord(record);
    }

    async function submitForm(values: Record<string, string>) {
        if (!data || formRecord === undefined) {
            return;
        }

        mutation.transform(() => ({ ...values, context }));
        const response = formRecord
            ? await mutation.put(withContext(formRecord.routes.edit!, context))
            : await mutation.post(withContext(data.routes.create!, context));

        setFormRecord(undefined);
        await refresh({
            page: data.records.current_page,
            per_page: data.records.per_page,
            search: data.filters.search || undefined,
            sort: data.filters.sort || undefined,
            direction: data.filters.direction,
            filters: serializeFilters(data.filters.conditions),
        });

        if (!formRecord && response.record) {
            onCreated?.(response.record);
        }
    }

    async function destroyRecord(record: CrudRecord) {
        if (!data || !record.routes.destroy) {
            return;
        }

        mutation.transform(() => ({ context }));
        await mutation.delete(withContext(record.routes.destroy, context));
        await refresh({
            page: data.records.current_page,
            per_page: data.records.per_page,
            search: data.filters.search || undefined,
            sort: data.filters.sort || undefined,
            direction: data.filters.direction,
            filters: serializeFilters(data.filters.conditions),
        });
        onDeleted?.(record);
    }

    async function performBulkAction(action: CrudRecordAction) {
        const keys = action.data?.keys;

        if (!data?.routes.bulk || !Array.isArray(keys)) {
            return;
        }

        bulkMutation.transform(() => ({
            action: action.key,
            context,
            keys,
        }));
        await bulkMutation.post(data.routes.bulk);
        await refresh({
            page: data.records.current_page,
            per_page: data.records.per_page,
            search: data.filters.search || undefined,
            sort: data.filters.sort || undefined,
            direction: data.filters.direction,
            filters: serializeFilters(data.filters.conditions),
        });
    }

    if (!data || !definition) {
        return (
            <div className="rounded-lg border bg-card p-4 text-sm text-muted-foreground">
                Loading…
            </div>
        );
    }

    return (
        <>
            <DataGridView
                resource={definition}
                records={{
                    ...data.records,
                    data: data.records.data.map((record) => ({
                        ...record,
                        routes: {
                            ...record.routes,
                            edit: definition.permissions?.update
                                ? record.routes.edit
                                : null,
                            destroy: definition.permissions?.delete
                                ? record.routes.destroy
                                : null,
                        },
                    })),
                }}
                filters={data.filters}
                routes={{
                    ...data.routes,
                    create: definition.permissions?.create
                        ? data.routes.create
                        : null,
                }}
                callbacks={{
                    onCreate: definition.permissions?.create
                        ? () => openForm(null)
                        : undefined,
                    onShow: (record) => setActiveRecord(record),
                    onEdit: definition.permissions?.update
                        ? (record) => openForm(record)
                        : undefined,
                    onDestroy: definition.permissions?.delete
                        ? (record) => setRecordToDelete(record)
                        : undefined,
                    onBulkAction: definition.permissions?.bulk
                        ? performBulkAction
                        : undefined,
                    onQueryChange: ({
                        page,
                        per_page,
                        search,
                        sort,
                        direction,
                        filters,
                    }) =>
                        void refresh({
                            page,
                            per_page: config.pageSize ?? per_page,
                            search,
                            sort,
                            direction,
                            filters,
                        }),
                }}
                headerActions={headerActions}
                showSearch={config.showSearch ?? definition.showSearch ?? true}
                showFilters={
                    config.showFilters ?? definition.showFilters ?? false
                }
                showColumnVisibility
                showRowActions={config.showRowActions ?? true}
                showPagination={
                    config.showPagination ?? definition.showPagination ?? true
                }
                enableSelection={
                    definition.permissions?.bulk &&
                    (config.showBulkActions ??
                        definition.showBulkActions ??
                        true)
                }
            />

            <AlertDialog
                open={recordToDelete !== null}
                onOpenChange={(open) => !open && setRecordToDelete(null)}
            >
                {recordToDelete && (
                    <DeleteRecordDialogContent
                        deleteUrl={recordToDelete.routes.destroy!}
                        recordName={String(
                            recordToDelete.values.name ??
                                definition.singularLabel,
                        )}
                        resourceLabel={definition.singularLabel}
                        onAction={() => destroyRecord(recordToDelete)}
                        onSuccess={() => setRecordToDelete(null)}
                    />
                )}
            </AlertDialog>

            <Sheet
                open={formRecord !== undefined}
                onOpenChange={(open) => !open && setFormRecord(undefined)}
            >
                <SheetContent side="right" className={widgetSheetClassName}>
                    {formRecord !== undefined && (
                        <CrudForm
                            key={formRecord?.key ?? 'create'}
                            resource={definition}
                            record={formRecord}
                            routes={data.routes}
                            submit={{
                                method: formRecord ? 'put' : 'post',
                                url: formRecord
                                    ? formRecord.routes.edit!
                                    : data.routes.create!,
                            }}
                            presentation="sheet"
                            onCancel={() => setFormRecord(undefined)}
                            onSubmit={submitForm}
                            submitErrors={mutation.errors}
                            submitting={mutation.processing}
                        />
                    )}
                </SheetContent>
            </Sheet>

            <Sheet
                open={activeRecord !== null}
                onOpenChange={(open) => !open && setActiveRecord(null)}
            >
                <SheetContent side="right" className={widgetSheetClassName}>
                    {activeRecord && (
                        <CrudShow
                            resource={definition}
                            record={activeRecord}
                            routes={{
                                ...data.routes,
                                edit: null,
                                destroy: null,
                            }}
                            presentation="sheet"
                        />
                    )}
                </SheetContent>
            </Sheet>
        </>
    );
}
