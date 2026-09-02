import { router } from '@inertiajs/react';
import { useState } from 'react';
import type { CrudFilter, CrudFilters } from '../crud/types';

export type DataGridQueryParameters = {
    search?: string;
    sort?: string;
    direction?: 'asc' | 'desc';
    per_page?: number;
    page?: number;
    filters?: Record<number, CrudFilter>;
};

export function useDataGridQuery(
    filters: CrudFilters,
    indexUrl: string,
    onVisit?: (parameters: DataGridQueryParameters) => void,
) {
    const [search, setSearch] = useState(filters.search);
    const [conditions, setConditions] = useState(filters.conditions);

    const visitIndex = (overrides: DataGridQueryParameters) => {
        const parameters: DataGridQueryParameters = {
            search: filters.search || undefined,
            sort: filters.sort || undefined,
            direction: filters.sort ? filters.direction : undefined,
            per_page: filters.perPage,
            filters: serializeFilters(filters.conditions),
            ...overrides,
        };

        if (onVisit) {
            onVisit(parameters);

            return;
        }

        router.get(indexUrl, parameters, {
            preserveScroll: true,
            preserveState: true,
            replace: true,
        });
    };

    const changeConditions = (nextConditions: CrudFilter[]) => {
        setConditions(nextConditions);

        if (
            nextConditions.some((condition) => {
                if (condition.operator === 'empty') {
                    return condition.values.length !== 0;
                }

                const expectedValues = condition.operator === 'between' ? 2 : 1;

                return (
                    condition.values.length !== expectedValues ||
                    condition.values.some((value) => value === '')
                );
            })
        ) {
            return;
        }

        visitIndex({
            page: 1,
            filters: serializeFilters(nextConditions),
        });
    };

    const changeSearch = (nextSearch: string) => {
        visitIndex({
            page: 1,
            search: nextSearch || undefined,
        });
    };

    return {
        changeConditions,
        changeSearch,
        conditions,
        search,
        setSearch,
        visitIndex,
    };
}

export function serializeFilters(
    conditions: CrudFilter[],
): Record<number, CrudFilter> | undefined {
    if (conditions.length === 0) {
        return undefined;
    }

    return Object.fromEntries(
        conditions.map((condition, index) => [index, condition]),
    );
}
