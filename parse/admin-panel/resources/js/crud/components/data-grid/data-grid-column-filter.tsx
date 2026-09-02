import { CheckIcon, ListFilterIcon } from 'lucide-react';
import { Button } from '@admin-panel/ui';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@admin-panel/ui';
import { useCrudI18n } from '../../i18n/crud-i18n';
import type { CrudColumn } from '../crud/types';

type DataGridColumnFilterProps = {
    column: CrudColumn;
    value?: string;
    onChange: (value?: string) => void;
};

export function DataGridColumnFilter({
    column,
    value,
    onChange,
}: DataGridColumnFilterProps) {
    const { booleanOptions, translateOptionLabel } = useCrudI18n();
    const options =
        column.type === 'boolean'
            ? Object.fromEntries(
                  booleanOptions.map((option) => [option.value, option]),
              )
            : (column.options ?? {});
    const selectedLabel = value
        ? translateOptionLabel(options[value]?.label ?? value)
        : null;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="outline" />}>
                <ListFilterIcon aria-hidden="true" />
                {selectedLabel ?? column.label}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-44">
                <DropdownMenuGroup>
                    <DropdownMenuLabel>
                        Filter by {column.label.toLowerCase()}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => onChange()}>
                        <span className="flex-1">All</span>
                        {!value && <CheckIcon aria-hidden="true" />}
                    </DropdownMenuItem>
                    {Object.entries(options).map(([optionValue, option]) => (
                        <DropdownMenuItem
                            key={optionValue}
                            onClick={() => onChange(optionValue)}
                        >
                            <span className="flex-1">
                                {translateOptionLabel(option.label)}
                            </span>
                            {value === optionValue && (
                                <CheckIcon aria-hidden="true" />
                            )}
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
