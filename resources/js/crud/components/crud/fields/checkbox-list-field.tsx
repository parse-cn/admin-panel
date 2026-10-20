import { useState } from 'react';
import { Input } from '@admin-panel/ui/components/ui/input';
import { PermissionMatrix } from '../../../../components/permission-matrix';
import { Checkbox } from '@admin-panel/ui/components/ui/checkbox';
import { useCrudI18n } from '../../../i18n/crud-i18n';
import type { CrudField, CrudOption } from '../types';

export function CheckboxListField({ field, value, onChange }: {
  field: CrudField;
  value: string[];
  onChange: (value: string[]) => void;
}) {
  const { t } = useCrudI18n();
  const [search, setSearch] = useState('');
  const searchable = (field.options?.length ?? 0) > 6;
  const query = searchable ? search.trim().toLocaleLowerCase() : '';
  const options = (field.options ?? []).filter((option) =>
    !query || [option.label, option.group, option.permission].some((text) =>
      text?.toLocaleLowerCase().includes(query),
    ),
  );
  const searchInput = searchable && (
    <Input
      aria-label={t('crud.filters.search_field', { field: field.label })}
      placeholder={t('crud.filters.search_field', { field: field.label })}
      value={search}
      onChange={(event) => setSearch(event.target.value)}
    />
  );
  const groups = new Map<string, CrudOption[]>();
  for (const option of options) {
    const group = option.group ?? field.label;
    groups.set(group, [...(groups.get(group) ?? []), option]);
  }
  const selected = new Set(value);

  function toggle(values: string[], checked: boolean) {
    const next = new Set(value);
    for (const item of values) checked ? next.add(item) : next.delete(item);
    onChange([...next]);
  }

  if (field.name === 'permission_ids') {
    return (
      <div className="space-y-3">
        {searchable && <div className="px-3 pt-3">{searchInput}</div>}
        {query && options.length === 0 ? (
          <p className="px-3 pb-3 text-sm text-muted-foreground">{t('crud.filters.no_results')}</p>
        ) : (
          <PermissionMatrix label={field.label} id={`crud-${field.name}`} options={options} value={value} onChange={onChange} />
        )}
      </div>
    );
  }


  return (
    <div aria-label={field.label} className="space-y-3" id={`crud-${field.name}`} role="group">
      {searchInput}
      {query && groups.size === 0 && <p className="text-sm text-muted-foreground">{t('crud.filters.no_results')}</p>}
      {!query && groups.size === 0 && <p className="text-sm text-muted-foreground">{t('authorization.empty_permissions')}</p>}
      {[...groups].map(([group, options]) => {
        const values = options.map((option) => option.value ?? option.label);
        const count = values.filter((item) => selected.has(item)).length;
        return (
          <fieldset className="rounded-lg border p-4" key={group}>
            {field.name !== 'role_ids' && <legend className="max-w-full break-all px-1 text-sm font-medium">{group}</legend>}
            <label className="mb-3 flex cursor-pointer items-center gap-2 text-sm">
              <Checkbox checked={count === values.length} indeterminate={count > 0 && count < values.length} onCheckedChange={(checked) => toggle(values, checked)} />
              {t('authorization.select_all')} <span className="text-muted-foreground">{count}/{values.length}</span>
            </label>
            <div className={field.name === 'role_ids' ? 'flex flex-wrap gap-x-5 gap-y-2' : 'grid gap-3 sm:grid-cols-2'}>
              {options.map((option) => {
                const key = option.value ?? option.label;
                return (
                  <label className="flex min-w-0 cursor-pointer items-center gap-2 text-sm" key={key}>
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
