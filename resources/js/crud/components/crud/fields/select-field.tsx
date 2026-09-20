import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@admin-panel/ui';
import type { CrudField } from '../types';

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
        {(field.options ?? []).map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {translate(option.label)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
