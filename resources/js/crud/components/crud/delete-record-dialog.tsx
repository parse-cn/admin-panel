import type { ReactElement } from 'react';
import { useState } from 'react';
import { AlertDialog, AlertDialogTrigger } from '@admin-panel/ui';
import { useCrudI18n } from '../../i18n/crud-i18n';
import { ConfirmRecordActionDialogContent } from './confirm-record-action-dialog';
import type { CrudRecordAction } from './types';

type DeleteRecordDialogProps = {
    deleteUrl: string;
    recordName: string;
    resourceLabel: string;
    trigger: ReactElement;
};

type DeleteRecordDialogContentProps = Omit<
    DeleteRecordDialogProps,
    'trigger'
> & {
    onSuccess?: () => void;
    onAction?: (action: CrudRecordAction) => Promise<void> | void;
};

export function DeleteRecordDialogContent({
    deleteUrl,
    recordName,
    resourceLabel,
    onSuccess,
    onAction,
}: DeleteRecordDialogContentProps) {
    const { t } = useCrudI18n();
    const action: CrudRecordAction = {
        key: 'delete',
        label: t('crud.actions.delete'),
        method: 'delete',
        url: deleteUrl,
        icon: 'delete-bin-line',
        variant: 'destructive',
        confirmation: {
            title: t('crud.delete.title', { resource: resourceLabel }),
            description: t('crud.delete.description', {
                record: recordName,
            }),
            confirmLabel: t('crud.actions.delete'),
            processingLabel: t('crud.delete.processing'),
        },
    };

    return (
        <ConfirmRecordActionDialogContent
            action={action}
            onAction={onAction}
            onSuccess={onSuccess}
        />
    );
}

export function DeleteRecordDialog({
    trigger,
    ...props
}: DeleteRecordDialogProps) {
    const [open, setOpen] = useState(false);

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger render={trigger} />
            <DeleteRecordDialogContent
                {...props}
                onSuccess={() => setOpen(false)}
            />
        </AlertDialog>
    );
}
