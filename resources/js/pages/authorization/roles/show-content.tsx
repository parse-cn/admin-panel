import { Head, Link } from '@inertiajs/react';
import { ArrowLeftIcon, PencilIcon, ShieldCheckIcon, Trash2Icon } from 'lucide-react';
import type { CrudShowProps } from '@admin-panel/crud';
import { Badge, Button } from '@admin-panel/ui';
import { useAdminPanelBreadcrumb } from '../../../components/admin-panel-breadcrumb';
import { CrudCell } from '../../../crud/components/crud/crud-cell';
import { DeleteRecordDialog } from '../../../crud/components/crud/delete-record-dialog';
import { useCrudI18n } from '../../../crud/i18n/crud-i18n';
import { preserveCurrentQuery } from '../../../crud/lib/preserve-query';

type PermissionGroup = { name: string; label: string; permissions: string[] };

export default function RoleShowContent({
  resource,
  record,
  routes,
  presentation = 'page',
}: CrudShowProps & { presentation?: 'page' | 'sheet' }) {
  const { t } = useCrudI18n();
  const groups = (record.values.permission_groups ?? []) as PermissionGroup[];
  const permissionLabels = (record.values.permission_labels ?? {}) as Record<string, string>;
  const permissionCount = groups.reduce((count, group) => count + group.permissions.length, 0);
  const isSheet = presentation === 'sheet';
  const metadata = resource.columns.filter((column) => column.type === 'datetime');

  useAdminPanelBreadcrumb({
    label: record.title,
    parent: { href: routes.index, title: resource.title },
  });

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {!isSheet && <Head title={record.title} />}
      <header className={isSheet ? 'shrink-0 border-b px-6 py-5 pr-16' : 'border-b pb-5'}>
        {!isSheet && (
          <Link className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground" href={preserveCurrentQuery(routes.index)}>
            <ArrowLeftIcon className="size-4" aria-hidden="true" />
            {t('crud.show.back_to', { resource: resource.title })}
          </Link>
        )}
        <div className="flex items-center gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl border bg-muted/50 text-muted-foreground">
            <ShieldCheckIcon className="size-5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="break-all text-xl font-semibold tracking-tight">{record.title}</h1>
              <Badge variant="secondary">{String(record.values.guard_name ?? '')}</Badge>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {t('authorization.role')} · #{String(record.key)}
            </p>
          </div>
        </div>
      </header>

      <div className={isSheet ? 'min-h-0 flex-1 overflow-y-auto px-6 py-5' : 'py-5'}>
        {metadata.length > 0 && (
          <dl className="mb-6 grid gap-4 rounded-lg bg-muted/40 p-4 sm:grid-cols-2">
            {metadata.map((column) => (
              <div key={column.name} className="min-w-0 space-y-1">
                <dt className="text-xs text-muted-foreground">{column.label}</dt>
                <dd className="text-sm"><CrudCell column={column} value={record.values[column.name]} record={record} /></dd>
              </div>
            ))}
          </dl>
        )}
        <section aria-labelledby="role-granted-permissions" className="space-y-4">
          <div className="flex items-center gap-2">
            <h2 id="role-granted-permissions" className="text-sm font-semibold">{t('authorization.granted_permissions')}</h2>
            <Badge variant="secondary">{permissionCount}</Badge>
          </div>
          {groups.length === 0 ? (
            <p className="rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">{t('authorization.no_granted_permissions')}</p>
          ) : (
            <div className="grid gap-3 lg:grid-cols-2">
              {groups.map((group) => (
                <section key={group.name} className="min-w-0 rounded-lg border p-4">
                  <h3 className="mb-3 flex items-start justify-between gap-3 text-sm font-medium">
                    <span className="break-all">{group.label ?? group.name}</span>
                    <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{group.permissions.length}</span>
                  </h3>
                  <ul className="flex flex-wrap gap-2">
                    {group.permissions.map((permission) => (
                      <li key={permission} className="min-w-0 max-w-full">
                        <Badge variant="secondary" title={permission} className="max-w-full whitespace-normal break-all text-xs">{permissionLabels[permission] ?? permission}</Badge>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          )}
        </section>
      </div>

      {(routes.destroy || routes.edit) && (
        <footer className={isSheet ? 'flex shrink-0 items-center justify-between gap-3 border-t bg-background px-6 py-4' : 'flex items-center justify-between gap-3 border-t pt-4'}>
          <div>
            {routes.destroy && (
              <DeleteRecordDialog deleteUrl={routes.destroy} recordName={record.title} resourceLabel={resource.singularLabel} trigger={
                <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10 hover:text-destructive">
                  <Trash2Icon aria-hidden="true" />
                  {t('crud.show.delete', { resource: resource.singularLabel })}
                </Button>
              } />
            )}
          </div>
          {routes.edit && (
            <Button nativeButton={false} render={<Link href={routes.edit} />} size="sm">
              <PencilIcon aria-hidden="true" />
              {t('crud.show.edit', { resource: resource.singularLabel })}
            </Button>
          )}
        </footer>
      )}
    </div>
  );
}
