import { Checkbox } from '@admin-panel/ui/components/ui/checkbox';
import { useCrudI18n } from '../../../i18n/crud-i18n';
import type { CrudField, CrudOption } from '../types';

export function CheckboxListField({ field, value, onChange }: {
  field: CrudField;
  value: string[];
  onChange: (value: string[]) => void;
}) {
  const { t } = useCrudI18n();
  const groups = new Map<string, CrudOption[]>();
  for (const option of field.options ?? []) {
    const group = option.group ?? field.label;
    groups.set(group, [...(groups.get(group) ?? []), option]);
  }
  const selected = new Set(value);

  function toggle(values: string[], checked: boolean) {
    const next = new Set(value);
    for (const item of values) checked ? next.add(item) : next.delete(item);
    onChange([...next]);
  }

  return (
    <div aria-label={field.label} className="space-y-3" id={`crud-${field.name}`} role="group">
      {groups.size === 0 && <p className="text-sm text-muted-foreground">{t('authorization.empty_permissions')}</p>}
      {[...groups].map(([group, options]) => {
        const values = options.map((option) => option.value ?? option.label);
        const count = values.filter((item) => selected.has(item)).length;
        return (
          <fieldset className="rounded-lg border p-4" key={group}>
            <legend className="px-1 text-sm font-medium">{group}</legend>
            <label className="mb-3 flex cursor-pointer items-center gap-2 text-sm">
              <Checkbox checked={count === values.length} indeterminate={count > 0 && count < values.length} onCheckedChange={(checked) => toggle(values, checked)} />
              {t('authorization.select_all')} <span className="text-muted-foreground">{count}/{values.length}</span>
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              {options.map((option) => {
                const key = option.value ?? option.label;
                return (
                  <label className="flex cursor-pointer items-center gap-2 text-sm" key={key}>
                    <Checkbox checked={selected.has(key)} onCheckedChange={(checked) => toggle([key], checked)} />
                    <span className="break-all">{option.label}</span>
                  </label>
                );
              })}
            </div>
          </fieldset>
        );
      })}
    </div>
  );
}
