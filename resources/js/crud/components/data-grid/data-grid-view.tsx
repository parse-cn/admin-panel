'use client';
'use no memo';

import { Link } from '@inertiajs/react';
import { ArrowRightIcon } from 'lucide-react';
import { getCoreRowModel, useReactTable } from '@tanstack/react-table';
import type {
    ColumnDef,
    PaginationState,
    Row,
    RowSelectionState,
    SortingState,
} from '@tanstack/react-table';
import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';

import { DataGrid as ReuiDataGrid } from '@admin-panel/ui';
import { DataGridColumnHeader } from '@admin-panel/ui';
import { DataGridPagination } from '@admin-panel/ui';
import { DataGridScrollArea } from '@admin-panel/ui';
import {
    DataGridTable,
    DataGridTableRowSelect,
    DataGridTableRowSelectAll,
} from '@admin-panel/ui';
import { Frame, FrameFooter, FramePanel } from '@admin-panel/ui';
import { Separator } from '@admin-panel/ui';
import { useCrudI18n } from '../../i18n/crud-i18n';
import { preserveCurrentQuery } from '../../lib/preserve-query';
import { CrudCell } from '../crud/crud-cell';
import type {
    CrudDefinition,
    CrudFilters,
    CrudRecord,
    CrudRecordAction,
    CrudRoutes,
    PaginatedRecords,
} from '../crud/types';
import { DataGridRowActions } from './data-grid-row-actions';
import {
    DataGridHeader,
    DataGridSelectionToolbar,
    DataGridToolbar,
} from './data-grid-toolbar';
import { useDataGridQuery } from './use-data-grid-query';
import type { DataGridQueryParameters } from './use-data-grid-query';

type DataGridCallbacks = {
    onCreate?: () => void;
    onShow?: (record: CrudRecord) => void;
    onEdit?: (record: CrudRecord) => void;
    onDestroy?: (record: CrudRecord) => void;
    onBulkAction?: (action: CrudRecordAction) => Promise<void> | void;
    onQueryChange?: (parameters: DataGridQueryParameters) => void;
};

type DataGridViewProps = {
    resource: CrudDefinition;
    records: PaginatedRecords;
    filters: CrudFilters;
    routes: CrudRoutes;
    callbacks?: DataGridCallbacks;
    showFilters?: boolean;
    showSearch?: boolean;
    showColumnVisibility?: boolean;
    showRowActions?: boolean;
    showPagination?: boolean;
    enableSelection?: boolean;
    headerActions?: ReactNode;
};

export function DataGridView({
    resource,
    records,
    filters,
    routes,
    callbacks,
    showFilters = true,
    showSearch = true,
    showColumnVisibility = true,
    showRowActions = true,
    showPagination = true,
    enableSelection = true,
    headerActions,
}: DataGridViewProps) {
    const { t } = useCrudI18n();
    const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
    const visibleColumns = useMemo(
        () =>
            resource.columns.filter(
                (column) => !column.detailOnly && !column.hidden,
            ),
        [resource.columns],
    );
    const {
        changeConditions,
        changeSearch,
        conditions,
        search,
        setSearch,
        visitIndex,
    } = useDataGridQuery(filters, routes.index, callbacks?.onQueryChange);

    const columns = useMemo<ColumnDef<CrudRecord>[]>(
        () => [
            ...(enableSelection
                ? [
                      {
                          id: 'select',
                          header: () => <DataGridTableRowSelectAll />,
                          cell: ({ row }: { row: Row<CrudRecord> }) => (
                              <DataGridTableRowSelect row={row} />
                          ),
                          enableHiding: false,
                          enableSorting: false,
                          size: 48,
                          meta: {
                              cellClassName: 'whitespace-nowrap',
                              headerTitle: t('crud.columns.select'),
                          },
                      },
                  ]
                : []),
            ...visibleColumns.map<ColumnDef<CrudRecord>>((column) => ({
                id: column.name,
                accessorFn: (record) => record.values[column.name],
                enableSorting: column.sortable,
                header: ({ column: tableColumn }) => (
                    <DataGridColumnHeader
                        column={tableColumn}
                        title={column.label}
                        className={
                            column.type === 'decimal' ||
                            column.type === 'signed-decimal'
                                ? 'w-full justify-end whitespace-nowrap'
                                : 'whitespace-nowrap'
                        }
                    />
                ),
                cell: ({ row }) => {
                    const cell = (
                        <CrudCell
                            column={column}
                            href={
                                column.type === 'identity' &&
                                column.link === 'show'
                                    ? (row.original.routes.show ?? undefined)
                                    : undefined
                            }
                            onShow={
                                column.type === 'identity' &&
                                column.link === 'show' &&
                                !row.original.routes.show
                                    ? () => callbacks?.onShow?.(row.original)
                                    : undefined
                            }
                            record={row.original}
                            value={row.original.values[column.name]}
                        />
                    );

                    if (column.type === 'identity' || column.link !== 'show') {
                        return cell;
                    }

                    const detailLinkClassName =
                        'group/detail-link relative inline-flex w-fit max-w-full min-w-0 text-foreground no-underline outline-none after:absolute after:right-0 after:bottom-0 after:left-0 after:h-px after:origin-left after:scale-x-0 after:bg-foreground after:opacity-0 after:transition-[transform,opacity] after:duration-280 after:ease-out hover:after:scale-x-100 hover:after:opacity-100 focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none focus-visible:after:scale-x-100 focus-visible:after:opacity-100 motion-reduce:after:transition-none';
                    const detailLinkContent = (
                        <>
                            {cell}
                            <ArrowRightIcon
                                aria-hidden="true"
                                className="size-3 shrink-0 self-center text-muted-foreground opacity-0 transition-[transform,opacity] duration-180 ease-out group-hover/detail-link:translate-x-0.5 group-hover/detail-link:scale-100 group-hover/detail-link:opacity-100 group-focus-visible/detail-link:translate-x-0.5 group-focus-visible/detail-link:scale-100 group-focus-visible/detail-link:opacity-100 motion-reduce:transition-none"
                            />
                        </>
                    );

                    if (row.original.routes.show) {
                        return (
                            <Link
                                href={preserveCurrentQuery(
                                    row.original.routes.show,
                                )}
                                className={detailLinkClassName}
                            >
                                {detailLinkContent}
                            </Link>
                        );
                    }

                    return callbacks?.onShow ? (
                        <button
                            type="button"
                            className={`appearance-none border-0 bg-transparent p-0 text-left ${detailLinkClassName}`}
                            onClick={() => callbacks.onShow?.(row.original)}
                        >
                            {detailLinkContent}
                        </button>
                    ) : (
                        cell
                    );
                },
                meta: {
                    headerTitle: column.label,
                    cellClassName:
                        column.type === 'decimal' ||
                        column.type === 'signed-decimal'
                            ? 'text-right whitespace-nowrap'
                            : 'whitespace-nowrap',
                },
            })),
            ...(showRowActions
                ? [
                      {
                          id: 'actions',
                          header: () => (
                              <span className="sr-only">
                                  {t('crud.columns.actions')}
                              </span>
                          ),
                          cell: ({ row }: { row: Row<CrudRecord> }) => (
                              <DataGridRowActions
                                  record={row.original}
                                  resource={resource}
                                  onShow={callbacks?.onShow}
                                  onEdit={callbacks?.onEdit}
                                  onDestroy={callbacks?.onDestroy}
                              />
                          ),
                          enableHiding: false,
                          enableSorting: false,
                          size: 52,
                          meta: {
                              cellClassName: 'text-right whitespace-nowrap',
                              headerTitle: t('crud.columns.actions'),
                          },
                      },
                  ]
                : []),
        ],
        [
            callbacks,
            enableSelection,
            resource,
            showRowActions,
            t,
            visibleColumns,
        ],
    );

    const sorting: SortingState = filters.sort
        ? [{ id: filters.sort, desc: filters.direction === 'desc' }]
        : [];
    const pagination: PaginationState = {
        pageIndex: records.current_page - 1,
        pageSize: records.per_page,
    };
    const table = useReactTable({
        columns,
        data: records.data,
        enableRowSelection: enableSelection,
        enableSortingRemoval: true,
        getCoreRowModel: getCoreRowModel(),
        getRowId: (record) => String(record.key),
        manualPagination: true,
        manualSorting: true,
        onPaginationChange: (updater) => {
            const next =
                typeof updater === 'function' ? updater(pagination) : updater;

            if (next.pageSize !== pagination.pageSize) {
                setRowSelection({});
                visitIndex({ page: 1, per_page: next.pageSize });
            } else if (next.pageIndex !== pagination.pageIndex) {
                setRowSelection({});
                visitIndex({ page: next.pageIndex + 1 });
            }
        },
        onRowSelectionChange: setRowSelection,
        onSortingChange: (updater) => {
            const next =
                typeof updater === 'function' ? updater(sorting) : updater;
            const selected = next[0];

            if (selected) {
                setRowSelection({});
                visitIndex({
                    page: 1,
                    sort: selected.id,
                    direction: selected.desc ? 'desc' : 'asc',
                });
            } else {
                setRowSelection({});
                visitIndex({
                    page: 1,
                    sort: undefined,
                    direction: undefined,
                });
            }
        },
        pageCount: records.last_page,
        sortDescFirst: false,
        state: { pagination, rowSelection, sorting },
    });

    return (
        <ReuiDataGrid
            table={table}
            recordCount={records.total}
            emptyMessage={t('crud.list.empty', {
                resource: resource.title,
            })}
            tableLayout={{
                columnsResizable: false,
                columnsVisibility: true,
                dense: true,
                rowBorder: true,
                width: 'auto',
            }}
        >
            <Frame variant="default" spacing="sm" className="w-full" dense>
                <DataGridHeader
                    records={records}
                    resource={resource}
                    routes={routes}
                    actions={headerActions}
                    onCreate={callbacks?.onCreate}
                />

                <FramePanel className="bg-card p-0! shadow-none!">
                    {enableSelection &&
                    table.getSelectedRowModel().rows.length > 0 ? (
                        <DataGridSelectionToolbar
                            resource={resource}
                            table={table}
                            onAction={callbacks?.onBulkAction}
                        />
                    ) : (
                        <DataGridToolbar
                            conditions={conditions}
                            onConditionsChange={(nextConditions) => {
                                table.resetRowSelection();
                                changeConditions(nextConditions);
                            }}
                            onSearchChange={(nextSearch) => {
                                table.resetRowSelection();
                                changeSearch(nextSearch);
                            }}
                            resource={resource}
                            search={search}
                            setSearch={setSearch}
                            showFilters={showFilters}
                            showSearch={showSearch}
                            showColumnVisibility={showColumnVisibility}
                            table={table}
                        />
                    )}
                    <Separator />
                    <DataGridScrollArea>
                        <DataGridTable />
                    </DataGridScrollArea>
                </FramePanel>

                {showPagination && (
                    <FrameFooter>
                        <DataGridPagination
                            sizes={resource.pagination.perPageOptions}
                            info={t('crud.pagination.info')}
                            nextPageLabel={t('crud.pagination.next')}
                            previousPageLabel={t('crud.pagination.previous')}
                            rowsPerPageLabel={t(
                                'crud.pagination.rows_per_page',
                            )}
                        />
                    </FrameFooter>
                )}
            </Frame>
        </ReuiDataGrid>
    );
}
