import { Link, router } from '@inertiajs/react';
import { EllipsisIcon, EyeIcon, PencilIcon } from 'lucide-react';
import { useState } from 'react';
import { AlertDialog } from '@admin-panel/ui';
import { Button } from '@admin-panel/ui';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@admin-panel/ui';
import { RemixIcon } from '@admin-panel/ui';
import { ConfirmRecordActionDialogContent } from '../crud/confirm-record-action-dialog';
import type {
    CrudDefinition,
    CrudRecord,
    CrudRecordAction,
} from '../crud/types';
import { useCrudI18n } from '../../i18n/crud-i18n';
import { preserveCurrentQuery } from '../../lib/preserve-query';

type DataGridRowActionsProps = {
    record: CrudRecord;
    resource: CrudDefinition;
    onShow?: (record: CrudRecord) => void;
    onEdit?: (record: CrudRecord) => void;
    onDestroy?: (record: CrudRecord) => void;
};

export function DataGridRowActions({
    record,
    resource,
    onShow,
    onEdit,
    onDestroy,
}: DataGridRowActionsProps) {
    const { t } = useCrudI18n();
    const recordName = record.title;
    const [selectedAction, setSelectedAction] =
        useState<CrudRecordAction | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const deleteAction: CrudRecordAction | null = record.routes.destroy
        ? {
              key: 'delete',
              label: t('crud.actions.delete'),
              method: 'delete',
              url: record.routes.destroy,
              icon: 'delete-bin-line',
              variant: 'destructive',
              confirmation: {
                  title: t('crud.delete.title', {
                      resource: resource.singularLabel,
                  }),
                  description: t('crud.delete.description', {
                      record: recordName,
                  }),
                  confirmLabel: t('crud.actions.delete'),
                  processingLabel: t('crud.delete.processing'),
              },
          }
        : null;

    function performAction(action: CrudRecordAction) {
        if (action.confirmation) {
            setSelectedAction(action);
            setDialogOpen(true);

            return;
        }

        router.visit(action.url, {
            method: action.method,
            data: action.data,
            preserveScroll: true,
        });
    }

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger
                    render={
                        <Button
                            size="icon-sm"
                            variant="ghost"
                            aria-label={t('crud.actions.record_menu', {
                                record: recordName,
                            })}
                        />
                    }
                >
                    <EllipsisIcon aria-hidden="true" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-36">
                    {(record.routes.show || onShow) && (
                        <DropdownMenuItem
                            render={
                                onShow || !record.routes.show ? undefined : (
                                    <Link
                                        href={preserveCurrentQuery(
                                            record.routes.show,
                                        )}
                                    />
                                )
                            }
                            onClick={() => onShow?.(record)}
                        >
                            <EyeIcon aria-hidden="true" />
                            {t('crud.actions.view')}
                        </DropdownMenuItem>
                    )}
                    {(record.routes.edit || onEdit) && (
                        <DropdownMenuItem
                            render={
                                onEdit || !record.routes.edit ? undefined : (
                                    <Link href={record.routes.edit} />
                                )
                            }
                            onClick={() => onEdit?.(record)}
                        >
                            <PencilIcon aria-hidden="true" />
                            {t('crud.actions.edit')}
                        </DropdownMenuItem>
                    )}
                    {(record.actions.length > 0 || deleteAction) && (
                        <>
                            <DropdownMenuSeparator />
                            {record.actions.map((action) => (
                                <DropdownMenuItem
                                    key={action.key}
                                    variant={action.variant}
                                    onClick={() => performAction(action)}
                                >
                                    {action.icon && (
                                        <RemixIcon name={action.icon} />
                                    )}
                                    {action.label}
                                </DropdownMenuItem>
                            ))}
                            {deleteAction && (
                                <DropdownMenuItem
                                    variant="destructive"
                                    onClick={() =>
                                        onDestroy
                                            ? onDestroy(record)
                                            : performAction(deleteAction)
                                    }
                                >
                                    <RemixIcon name={deleteAction.icon!} />
                                    {t('crud.actions.delete')}
                                </DropdownMenuItem>
                            )}
                        </>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>
            <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
                {selectedAction && (
                    <ConfirmRecordActionDialogContent
                        action={selectedAction}
                        onSuccess={() => setDialogOpen(false)}
                    />
                )}
            </AlertDialog>
        </>
    );
}
