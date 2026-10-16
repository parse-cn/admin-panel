import { PermissionMatrix } from '../../../components/permission-matrix';
import type { CrudOption } from '../../../crud/components/crud/types';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeftIcon, PencilIcon, ShieldCheckIcon, Trash2Icon } from 'lucide-react';
import type { CrudShowProps } from '@admin-panel/crud';
import { Badge, Button, Frame, FrameHeader, FramePanel } from '@admin-panel/ui';
import { useAdminPanelBreadcrumb } from '../../../components/admin-panel-breadcrumb';
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
  const options = (record.values.permission_options ?? []) as CrudOption[];
  const selected = (record.values.permission_ids ?? []) as string[];
  const permissionCount = groups.reduce((count, group) => count + group.permissions.length, 0);
  const isSheet = presentation === 'sheet';

  useAdminPanelBreadcrumb({
    label: record.title,
    parent: { href: routes.index, title: resource.title },
  });

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {!isSheet && <Head title={record.title} />}
      <header className={isSheet ? 'shrink-0 border-b px-5 py-3 pr-16' : 'border-b pb-3'}>
        {!isSheet && (
          <Link className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground" href={preserveCurrentQuery(routes.index)}>
            <ArrowLeftIcon className="size-4" aria-hidden="true" />
            {t('crud.show.back_to', { resource: resource.title })}
          </Link>
        )}
        <div className="flex items-center gap-2">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border bg-muted/50 text-muted-foreground">
            <ShieldCheckIcon className="size-5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="break-all text-lg font-semibold tracking-tight">{record.title}</h1>
              <Badge variant="secondary">{String(record.values.guard_name ?? '')}</Badge>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {t('authorization.role')} · #{String(record.key)}
            </p>
          </div>
        </div>
      </header>

      <div className={isSheet ? 'min-h-0 flex-1 overflow-y-auto px-5 py-3' : 'py-3'}>
        <Frame aria-labelledby="role-granted-permissions" className="min-w-0 w-full" spacing="sm">
          <FrameHeader className="flex-row items-center gap-2">
            <h2 id="role-granted-permissions" className="text-sm font-semibold">{t('authorization.permissions')}</h2>
            <Badge variant="secondary">{permissionCount}/{options.length}</Badge>
          </FrameHeader>
          <FramePanel className="px-0 py-0">
            <PermissionMatrix label={t('authorization.permissions')} options={options} value={selected} />
          </FramePanel>
        </Frame>
      </div>

      {(routes.destroy || routes.edit) && (
        <footer className={isSheet ? 'flex shrink-0 items-center justify-between gap-3 border-t bg-background px-5 py-3' : 'flex items-center justify-between gap-3 border-t pt-3'}>
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
