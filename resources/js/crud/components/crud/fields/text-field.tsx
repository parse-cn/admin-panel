import { Input } from '@admin-panel/ui';
import type { CrudField } from '../types';

export function TextField({
  error,
  field,
  required,
  value,
  onChange,
}: {
  error?: string;
  field: CrudField;
  required: boolean;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <Input
      aria-invalid={Boolean(error)}
      autoComplete={field.type === 'password' ? 'new-password' : undefined}
      id={`crud-${field.name}`}
      onChange={(event) => onChange(event.target.value)}
      placeholder={field.placeholder}
      required={required}
      type={field.type}
      value={value}
    />
  );
}
