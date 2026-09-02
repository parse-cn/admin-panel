'use no memo';

import { useState } from 'react';
import type { ReactElement } from 'react';
import type { Table } from '@tanstack/react-table';

import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from '../../ui/dropdown-menu';
import { getColumnHeaderLabel } from './data-grid';

function DataGridColumnVisibility<TData>({
    table,
    trigger,
    label = 'Toggle Columns',
}: {
    table: Table<TData>;
    trigger: ReactElement<Record<string, unknown>>;
    label?: string;
}) {
    const getVisibility = () =>
        Object.fromEntries(
            table
                .getAllColumns()
                .map((column) => [column.id, column.getIsVisible()]),
        );
    const [visibility, setVisibility] = useState(getVisibility);

    return (
        <DropdownMenu
            onOpenChange={(open) => {
                if (open) {
                    setVisibility(getVisibility());
                }
            }}
        >
            <DropdownMenuTrigger render={trigger} />
            <DropdownMenuContent align="end" className="min-w-[150px]">
                <DropdownMenuGroup>
                    <DropdownMenuLabel className="font-medium">
                        {label}
                    </DropdownMenuLabel>
                    {table
                        .getAllColumns()
                        .filter((column) => column.getCanHide())
                        .map((column) => {
                            return (
                                <DropdownMenuCheckboxItem
                                    key={column.id}
                                    className="capitalize"
                                    checked={
                                        visibility[column.id] ??
                                        column.getIsVisible()
                                    }
                                    onSelect={(event) => event.preventDefault()}
                                    onCheckedChange={(value) => {
                                        const isVisible = !!value;

                                        setVisibility((current) => ({
                                            ...current,
                                            [column.id]: isVisible,
                                        }));
                                        column.toggleVisibility(isVisible);
                                    }}
                                >
                                    {getColumnHeaderLabel(column)}
                                </DropdownMenuCheckboxItem>
                            );
                        })}
                </DropdownMenuGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

export { DataGridColumnVisibility };
