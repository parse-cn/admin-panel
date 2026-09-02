import { useHttp } from '@inertiajs/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import type {
    CrudDefinition,
    CrudFilter,
    CrudFilters,
    CrudRoutes,
    PaginatedRecords,
} from '../components/crud/types';

export type CrudWidgetData = {
    resource: CrudDefinition;
    records: PaginatedRecords;
    filters: CrudFilters;
    routes: CrudRoutes;
};

export type CrudWidgetContextValue =
    string | number | boolean | null | undefined;

export type CrudWidgetQuery = {
    context: Record<string, CrudWidgetContextValue>;
    page?: number;
    per_page?: number;
    search?: string;
    sort?: string;
    direction?: 'asc' | 'desc';
    filters?: Record<number, CrudFilter>;
};

export function useCrudData(
    url: string,
    context: Record<string, CrudWidgetContextValue>,
) {
    const request = useHttp<CrudWidgetQuery, CrudWidgetData>({ context });
    const [data, setData] = useState<CrudWidgetData | null>(null);
    const requestRef = useRef(request);
    const contextRef = useRef(context);
    const contextKey = JSON.stringify(context);

    useEffect(() => {
        requestRef.current = request;
        contextRef.current = context;
    }, [context, request]);

    const refresh = useCallback(
        async (query: Omit<CrudWidgetQuery, 'context'> = {}) => {
            const activeRequest = requestRef.current;

            activeRequest.transform(() => ({
                context: contextRef.current,
                ...query,
            }));
            const response = await activeRequest.get(url);
            setData(response);

            return response;
        },
        [url],
    );

    useEffect(() => {
        void refresh();
    }, [contextKey, refresh]);

    return { ...request, data, refresh };
}
