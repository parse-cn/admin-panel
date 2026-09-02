import { router } from '@inertiajs/react';
import { useState } from 'react';
import {
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogMedia,
    AlertDialogTitle,
} from '@admin-panel/ui';
import { RemixIcon } from '@admin-panel/ui';
import { useCrudI18n } from '../../i18n/crud-i18n';
import type { CrudRecordAction } from './types';

type ConfirmRecordActionDialogProps = {
    action: CrudRecordAction;
    onSuccess?: () => void;
    onAction?: (action: CrudRecordAction) => Promise<void> | void;
};

export function ConfirmRecordActionDialogContent({
    action,
    onSuccess,
    onAction,
}: ConfirmRecordActionDialogProps) {
    const { t } = useCrudI18n();
    const [processing, setProcessing] = useState(false);
    const confirmation = action.confirmation;

    if (!confirmation) {
        return null;
    }

    async function performAction() {
        setProcessing(true);

        if (onAction) {
            try {
                await onAction(action);
                onSuccess?.();
            } finally {
                setProcessing(false);
            }

            return;
        }

        router.visit(action.url, {
            method: action.method,
            data: action.data,
            preserveScroll: true,
            onSuccess,
            onFinish: () => setProcessing(false),
        });
    }

    return (
        <AlertDialogContent size="sm">
            <AlertDialogHeader>
                <AlertDialogMedia
                    className={
                        action.variant === 'destructive'
                            ? 'bg-destructive/10 text-destructive dark:bg-destructive/20 dark:text-destructive'
                            : 'bg-primary/10 text-primary'
                    }
                >
                    <RemixIcon
                        name={action.icon ?? 'question-line'}
                        className="text-2xl"
                    />
                </AlertDialogMedia>
                <AlertDialogTitle>{confirmation.title}</AlertDialogTitle>
                <AlertDialogDescription>
                    {confirmation.description}
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel variant="ghost" disabled={processing}>
                    {t('common.cancel')}
                </AlertDialogCancel>
                <AlertDialogAction
                    variant={
                        action.variant === 'destructive'
                            ? 'destructive'
                            : 'default'
                    }
                    disabled={processing}
                    onClick={performAction}
                >
                    {processing
                        ? (confirmation.processingLabel ?? t('crud.processing'))
                        : confirmation.confirmLabel}
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    );
}
