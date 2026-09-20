import { Switch } from '@admin-panel/ui';
import type { CrudField } from '../types';

export function BooleanField({
  field,
  label,
  value,
  onChange,
}: {
  field: CrudField;
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex h-9 items-center gap-3">
      <Switch
        aria-label={field.label}
        checked={value === '1'}
        id={`crud-${field.name}`}
        name={field.name}
        onCheckedChange={(checked) => onChange(checked ? '1' : '0')}
      />
      <span className="text-sm text-muted-foreground">{label}</span>
    </div>
  );
}
