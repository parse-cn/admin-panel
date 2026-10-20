import { Combobox, ComboboxContent, ComboboxEmpty, ComboboxInput, ComboboxItem, ComboboxList } from '@admin-panel/ui/components/ui/combobox';
import { useCrudI18n } from '../../../i18n/crud-i18n';
import {
  RemixIcon,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@admin-panel/ui';
import type { CrudField } from '../types';

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

type Props = {
  error?: string;
  field: CrudField;
  placeholder: string;
  value: string;
  translate: (label: string) => string;
  onChange: (value: string) => void;
};

export function SelectField({
  error,
  field,
  placeholder,
  value,
  translate,
  onChange,
}: Props) {
  const { t } = useCrudI18n();
  const options = field.options ?? [];

  if (options.length > 6) {
    const items = options.map((option) => ({
      ...option,
      label: translate(option.label),
    }));

    return (
      <Combobox
        items={items}
        name={field.name}
        value={items.find((item) => item.value === value) ?? null}
        isItemEqualToValue={(item, selected) => item.value === selected.value}
        onValueChange={(next) => onChange(next?.value ?? '')}
        required={field.required}
      >
        <ComboboxInput
          aria-invalid={Boolean(error)}
          className="w-full"
          id={`crud-${field.name}`}
          placeholder={placeholder}
        />
        <ComboboxContent>
          <ComboboxEmpty>{t('crud.filters.no_results')}</ComboboxEmpty>
          <ComboboxList>
            {(option: (typeof items)[number]) => (
              <ComboboxItem key={option.value} value={option}>
                {option.dot && (
                  <span aria-hidden="true" className={`size-1.5 shrink-0 rounded-full bg-current ${optionTextColors[option.variant ?? 'default']} ${option.pulse ? 'animate-pulse' : ''}`} />
                )}
                {option.icon && (
                  <RemixIcon aria-hidden="true" name={option.icon} className={`shrink-0 text-sm ${optionTextColors[option.variant ?? 'default']}`} />
                )}
                {option.label}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    );
  }

  return (
    <Select
      items={(field.options ?? []).map((option) => ({
        label: translate(option.label),
        value: option.value,
      }))}
      name={field.name}
      onValueChange={(next) => onChange(next ?? '')}
      required={field.required}
      value={value}
    >
      <SelectTrigger
        aria-invalid={Boolean(error)}
        className="w-full"
        id={`crud-${field.name}`}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent align="start" alignItemWithTrigger={false}>
        {(field.options ?? []).map((option) => {
          const color = optionTextColors[option.variant ?? 'default'];

          return (
            <SelectItem key={option.value} value={option.value}>
              {option.dot && (
                <span
                  aria-hidden="true"
                  className={`size-1.5 shrink-0 rounded-full bg-current ${color} ${option.pulse ? 'animate-pulse' : ''}`}
                />
              )}
              {option.icon && (
                <RemixIcon
                  aria-hidden="true"
                  name={option.icon}
                  className={`shrink-0 text-sm ${color}`}
                />
              )}
              {translate(option.label)}
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}
