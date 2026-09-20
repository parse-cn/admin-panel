import { Textarea } from '@admin-panel/ui';
import type { CrudField } from '../types';

export function TextareaField({
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
    <Textarea
      aria-invalid={Boolean(error)}
      className="min-h-40 font-mono"
      id={`crud-${field.name}`}
      onChange={(event) => onChange(event.target.value)}
      placeholder={field.placeholder}
      required={required}
      value={value}
    />
  );
}
