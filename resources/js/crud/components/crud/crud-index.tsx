import { Head } from '@inertiajs/react';
import type { ReactNode } from 'react';
import { DataGridView } from '../data-grid/data-grid-view';
import type {
    CrudDefinition,
    CrudFilters,
    CrudRoutes,
    PaginatedRecords,
} from './types';
import type { CrudIndexHeader } from './types';

export type CrudIndexProps = {
    resource: CrudDefinition;
    records: PaginatedRecords;
    filters: CrudFilters;
    routes: CrudRoutes;
    indexHeader?: CrudIndexHeader;
    headerActions?: ReactNode;
};

export function CrudIndex(props: CrudIndexProps) {
    const { resource } = props;
    const showSearch = resource.columns.some((column) =>
        Boolean(column.searchable),
    );
    const showFilters = resource.columns.some((column) => column.filterable);

    return (
        <>
            <Head title={resource.title} />
            <div className="flex w-full flex-col gap-6">
                <DataGridView
                    {...props}
                    enableSelection={resource.bulkActions.length > 0}
                    showFilters={showFilters}
                    showRowActions={resource.showRowActions ?? true}
                    showSearch={showSearch}
                    headerActions={props.headerActions}
                />
            </div>
        </>
    );
}
