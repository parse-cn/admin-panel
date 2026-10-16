import { CheckIcon } from 'lucide-react';
import { Checkbox } from '@admin-panel/ui/components/ui/checkbox';
import type { CrudOption } from '../crud/components/crud/types';
import { useCrudI18n } from '../crud/i18n/crud-i18n';

const commonActions = ['viewAny', 'view', 'create', 'update', 'delete'];
const optionValue = (option: CrudOption) => option.value ?? option.label;
const actionOf = (option: CrudOption) => option.permission?.split('.').at(-1);

export function PermissionMatrix({ label, id, options, value, onChange }: {
  label: string;
  id?: string;
  options: CrudOption[];
  value: string[];
  onChange?: (value: string[]) => void;
}) {
  const { t } = useCrudI18n();
  const selected = new Set(value);
  const SelectionLabel = onChange ? 'label' : 'div';
  const groups = new Map<string, CrudOption[]>();
  for (const option of options) {
    const group = option.group ?? label;
    groups.set(group, [...(groups.get(group) ?? []), option]);
  }
  const actions = commonActions.filter((action) => options.some((option) => actionOf(option) === action));
  const isOther = (option: CrudOption) => !commonActions.includes(actionOf(option) ?? '');
  const hasOther = options.some(isOther);
  const selectedCount = options.filter((option) => selected.has(optionValue(option))).length;

  function toggle(items: CrudOption[], checked: boolean) {
    const next = new Set(value);
    for (const item of items) checked ? next.add(optionValue(item)) : next.delete(optionValue(item));
    onChange?.([...next]);
  }

  function renderPermission(option: CrudOption, group: string, showLabel = false) {
    const checked = selected.has(optionValue(option));
    const accessibleLabel = `${group} · ${option.label}`;
    return (
      <span key={optionValue(option)} className="flex min-h-6 items-center gap-2 text-sm" title={option.permission}>
        {onChange ? (
          <label className="flex min-h-6 cursor-pointer items-center gap-2">
            <Checkbox aria-label={accessibleLabel} checked={checked} onCheckedChange={(next) => toggle([option], next)} />
            {showLabel && <span className="break-words">{option.label}</span>}
          </label>
        ) : (
          <>
            <span role="img" aria-label={`${accessibleLabel}: ${t(checked ? 'boolean.true' : 'boolean.false')}`} className={`inline-flex size-4 shrink-0 items-center justify-center rounded border ${checked ? 'border-primary bg-primary text-primary-foreground' : 'border-input'}`}>
              {checked && <CheckIcon className="size-3" aria-hidden="true" />}
            </span>
            {showLabel && <span className="break-words">{option.label}</span>}
          </>
        )}
      </span>
    );
  }

  if (options.length === 0) {
    return <p id={id} className="py-4 text-sm text-muted-foreground">{t(onChange ? 'authorization.empty_permissions' : 'authorization.no_granted_permissions')}</p>;
  }

  return (
    <div id={id} className="isolate max-w-full overflow-x-auto">
      <table aria-label={label} className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b">
            <th scope="col" className="sticky left-0 z-10 min-w-40 bg-background px-3 py-3 text-left font-medium">
              <SelectionLabel className={`flex min-h-6 items-center gap-2 ${onChange ? 'cursor-pointer' : ''}`}>
                {onChange && (
                  <Checkbox
                    aria-label={t('authorization.select_all')}
                    checked={selectedCount === options.length}
                    indeterminate={selectedCount > 0 && selectedCount < options.length}
                    onCheckedChange={(checked) => toggle(options, checked)}
                  />
                )}
                <span>{t('authorization.permission_groups_label')}</span>
                {onChange && <span className="text-xs font-normal text-muted-foreground">{t('authorization.select_all')}</span>}
              </SelectionLabel>
            </th>
            {actions.map((action) => <th key={action} scope="col" className="min-w-20 whitespace-nowrap px-3 py-3 text-center text-xs font-normal text-muted-foreground">{t(`authorization.actions.${action}`)}</th>)}
            {hasOther && <th scope="col" className="min-w-44 px-3 py-3 text-left text-xs font-normal text-muted-foreground">{t('authorization.other_permissions')}</th>}
          </tr>
        </thead>
        <tbody>
          {[...groups].map(([group, items]) => {
            const count = items.filter((item) => selected.has(optionValue(item))).length;
            return (
              <tr key={group} className="border-b last:border-b-0">
                <th scope="row" className="sticky left-0 z-10 bg-background px-3 py-2.5 text-left font-medium">
                  <SelectionLabel className={`flex min-h-6 items-center gap-2 ${onChange ? 'cursor-pointer' : ''}`}>
                    {onChange && <Checkbox aria-label={`${group} · ${t('authorization.select_all')}`} checked={count === items.length} indeterminate={count > 0 && count < items.length} onCheckedChange={(checked) => toggle(items, checked)} />}
                    <span className="max-w-52 break-words">{group}</span>
                    <span className="shrink-0 text-xs font-normal tabular-nums text-muted-foreground">{count}/{items.length}</span>
                  </SelectionLabel>
                </th>
                {actions.map((action) => {
                  const matches = items.filter((item) => actionOf(item) === action);
                  return <td key={action} className="px-3 py-2.5 text-center align-middle"><div className="flex min-h-6 items-center justify-center gap-2">{matches.length ? matches.map((option) => renderPermission(option, group)) : <span className="text-muted-foreground">—</span>}</div></td>;
                })}
                {hasOther && <td className="px-3 py-2.5"><div className="flex flex-wrap gap-x-4 gap-y-1">{items.filter(isOther).map((option) => renderPermission(option, group, true))}</div></td>}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
