import { Link, router } from '@inertiajs/react';
import type { Table } from '@tanstack/react-table';
import { SearchIcon, Settings2Icon } from 'lucide-react';
import type { Dispatch, SetStateAction } from 'react';
import { useState } from 'react';
import { AlertDialog } from '@admin-panel/ui';
import { DataGridColumnVisibility, Filters } from '@admin-panel/ui';
import type { Filter, FilterFieldConfig } from '@admin-panel/ui';
import { FrameDescription, FrameHeader, FrameTitle } from '@admin-panel/ui';
import { Button, Input } from '@admin-panel/ui';
import { RemixIcon } from '@admin-panel/ui';
import { ConfirmRecordActionDialogContent } from '../crud/confirm-record-action-dialog';
import type {
    CrudDefinition,
    CrudFilter,
    CrudRecord,
    CrudRecordAction,
    CrudRoutes,
    PaginatedRecords,
} from '../crud/types';
import { useCrudI18n } from '../../i18n/crud-i18n';

type DataGridHeaderProps = {
    actions?: React.ReactNode;
    records: PaginatedRecords;
    resource: CrudDefinition;
    routes: CrudRoutes;
    onCreate?: () => void;
};

type DataGridSelectionToolbarProps = {
    resource: CrudDefinition;
    table: Table<CrudRecord>;
    onAction?: (action: CrudRecordAction) => Promise<void> | void;
};

export function DataGridSelectionToolbar({
    resource,
    table,
    onAction,
}: DataGridSelectionToolbarProps) {
    const { t } = useCrudI18n();
    const selectedRows = table.getSelectedRowModel().rows;
    const [selectedAction, setSelectedAction] =
        useState<CrudRecordAction | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const selectedKeys = selectedRows.map((row) => row.original.key);

    async function executeAction(action: CrudRecordAction) {
        if (onAction) {
            await onAction(action);
            table.resetRowSelection();

            return;
        }

        router.visit(action.url, {
            method: action.method,
            data: action.data,
            preserveScroll: true,
            onSuccess: () => table.resetRowSelection(),
        });
    }

    function performAction(action: CrudRecordAction) {
        const actionWithKeys = {
            ...action,
            data: { keys: selectedKeys, action: action.key },
        };

        if (action.confirmation) {
            setSelectedAction(actionWithKeys);
            setDialogOpen(true);

            return;
        }

        void executeAction(actionWithKeys);
    }

    return (
        <>
            <div className="flex min-h-14 items-center justify-between gap-3 px-4 py-2">
                <div className="flex min-w-0 items-center gap-2">
                    <span className="shrink-0 text-sm font-medium">
                        {t('crud.list.selected', {
                            count: selectedRows.length,
                        })}
                    </span>
                    {resource.bulkActions.map((action) => (
                        <Button
                            key={action.key}
                            variant="outline"
                            onClick={() => performAction(action)}
                        >
                            {action.icon && <RemixIcon name={action.icon} />}
                            {action.label}
                        </Button>
                    ))}
                </div>
                <Button
                    variant="outline"
                    onClick={() => table.resetRowSelection()}
                >
                    <RemixIcon name="close-line" />
                    {t('common.clear')}
                </Button>
            </div>
            <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
                {selectedAction && (
                    <ConfirmRecordActionDialogContent
                        action={selectedAction}
                        onAction={onAction}
                        onSuccess={() => {
                            setDialogOpen(false);
                            table.resetRowSelection();
                        }}
                    />
                )}
            </AlertDialog>
        </>
    );
}

export function DataGridHeader({
    actions,
    records,
    resource,
    routes,
    onCreate,
}: DataGridHeaderProps) {
    const { t } = useCrudI18n();

    return (
        <FrameHeader className="flex-row items-center justify-between gap-3">
            <div className="flex flex-col gap-0.5">
                <FrameTitle id="page-heading" className="text-balance">
                    {resource.title}
                </FrameTitle>
                <FrameDescription className="text-xs text-pretty">
                    {resource.description ??
                        t('crud.list.summary', {
                            shown: records.data.length,
                            total: records.total,
                            resource: resource.title,
                        })}
                </FrameDescription>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2">
                {actions}
                {(routes.create || onCreate) && (
                    <Button
                        nativeButton={onCreate ? undefined : false}
                        render={
                            onCreate || !routes.create ? undefined : (
                                <Link href={routes.create} />
                            )
                        }
                        onClick={onCreate}
                    >
                        <RemixIcon name={'add-line'} />
                        {t('crud.actions.add', {
                            resource: resource.singularLabel,
                        })}
                    </Button>
                )}
            </div>
        </FrameHeader>
    );
}

type DataGridToolbarProps = {
    conditions: CrudFilter[];
    resource: CrudDefinition;
    table: Table<CrudRecord>;
    search: string;
    setSearch: Dispatch<SetStateAction<string>>;
    onConditionsChange: (conditions: CrudFilter[]) => void;
    onSearchChange: (search: string) => void;
    showFilters?: boolean;
    showSearch?: boolean;
    showColumnVisibility?: boolean;
};

export function DataGridToolbar({
    conditions = [],
    resource,
    table,
    search,
    setSearch,
    onConditionsChange,
    onSearchChange,
    showFilters = true,
    showSearch = true,
    showColumnVisibility = true,
}: DataGridToolbarProps) {
    const {
        booleanOptions,
        filterI18n,
        t,
        translateOperator,
        translateOptionLabel,
    } = useCrudI18n();
    const filterFields: FilterFieldConfig<string>[] = resource.columns
        .filter(
            (column) =>
                !column.detailOnly && column.filterable && column.filter,
        )
        .map((column) => ({
            key: column.name,
            label: column.label,
            type: column.filter?.type,
            defaultOperator: column.filter?.operators[0],
            operators: column.filter?.operators.map((operator) => ({
                value: operator,
                label:
                    operator === 'is' && column.filter?.type === 'text'
                        ? t('crud.filters.operators.is_exactly')
                        : translateOperator(operator),
            })),
            options:
                column.type === 'boolean'
                    ? booleanOptions
                    : Object.entries(column.options ?? {}).map(
                          ([value, option]) => ({
                              value,
                              label: translateOptionLabel(option.label),
                          }),
                      ),
        }));
    const filterConditions: Filter<string>[] = conditions.map((condition) => ({
        ...condition,
        id: condition.field,
    }));

    return (
        <div className="flex flex-col justify-between gap-2 px-4 py-3 sm:flex-row sm:items-center">
            <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center">
                {showSearch && (
                    <div className="w-full sm:max-w-xs">
                        <div className="relative min-w-0">
                            <SearchIcon
                                aria-hidden="true"
                                className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                            />
                            <Input
                                aria-label={t('crud.list.search', {
                                    resource: resource.title,
                                })}
                                className="pl-9"
                                onChange={(event) => {
                                    const nextSearch = event.target.value;

                                    setSearch(nextSearch);
                                    onSearchChange(nextSearch);
                                }}
                                placeholder={t('crud.list.search', {
                                    resource: resource.title,
                                })}
                                value={search}
                            />
                        </div>
                    </div>
                )}
                {showFilters && (
                    <Filters
                        filters={filterConditions}
                        fields={filterFields}
                        allowMultiple={false}
                        i18n={filterI18n}
                        trigger={
                            <Button variant="outline">
                                <RemixIcon name="filter-line" />
                                {t('crud.filters.trigger')}
                            </Button>
                        }
                        onChange={(nextFilters) => {
                            onConditionsChange(
                                nextFilters.map(
                                    ({ field, operator, values }) => ({
                                        field,
                                        operator,
                                        values,
                                    }),
                                ),
                            );
                        }}
                    />
                )}
            </div>
            {showColumnVisibility && (
                <DataGridColumnVisibility
                    table={table}
                    label={t('crud.columns.toggle')}
                    trigger={
                        <Button variant="outline">
                            <Settings2Icon aria-hidden="true" />
                            {t('crud.columns.trigger')}
                        </Button>
                    }
                />
            )}
        </div>
    );
}
