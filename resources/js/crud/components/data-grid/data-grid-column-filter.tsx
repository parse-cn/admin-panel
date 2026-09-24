import { CheckIcon, ListFilterIcon } from 'lucide-react';
import { Button, RemixIcon } from '@admin-panel/ui';
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
import type { CrudColumn, CrudOption } from '../crud/types';

const optionTextColors = {
  default: 'text-primary',
  primary: 'text-primary',
  secondary: 'text-muted-foreground',
  info: 'text-info',
  success: 'text-success',
  warning: 'text-warning',
  destructive: 'text-destructive',
  focus: 'text-focus',
  invert: 'text-foreground',
} as const;

function OptionAdornment({ option }: { option: CrudOption }) {
  const color = optionTextColors[option.variant ?? 'default'];

  if (option.dot) {
    return (
      <span
        aria-hidden="true"
        className={`size-1.5 shrink-0 rounded-full bg-current ${color} ${option.pulse ? 'animate-pulse' : ''}`}
      />
    );
  }

  if (option.icon) {
    return (
      <RemixIcon
        aria-hidden="true"
        name={option.icon}
        className={`shrink-0 text-sm ${color}`}
      />
    );
  }

  return null;
}

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
              <OptionAdornment option={option} />
              <span className="flex-1">
                {translateOptionLabel(option.label)}
              </span>
              {value === optionValue && <CheckIcon aria-hidden="true" />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
