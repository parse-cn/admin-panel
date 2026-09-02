import { router } from '@inertiajs/react';
import {
    CircleCheckIcon,
    InfoIcon,
    Loader2Icon,
    OctagonXIcon,
    TriangleAlertIcon,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Toaster as Sonner, toast } from 'sonner';
import type { CSSProperties } from 'react';
import type { ToasterProps } from 'sonner';

import type { AdminPanelFlashToast } from '../../types';

function useDocumentTheme(): 'light' | 'dark' {
    const [theme, setTheme] = useState<'light' | 'dark'>(() =>
        typeof document !== 'undefined' &&
        document.documentElement.classList.contains('dark')
            ? 'dark'
            : 'light',
    );

    useEffect(() => {
        const element = document.documentElement;
        const observer = new MutationObserver(() => {
            setTheme(element.classList.contains('dark') ? 'dark' : 'light');
        });

        observer.observe(element, {
            attributeFilter: ['class'],
            attributes: true,
        });

        return () => observer.disconnect();
    }, []);

    return theme;
}

function showFlashToast(value: unknown): void {
    if (!isAdminPanelFlashToast(value)) {
        return;
    }

    const options = value.description
        ? { description: value.description, duration: value.duration }
        : { duration: value.duration };

    switch (value.type) {
        case 'error':
            toast.error(value.message, options);
            break;
        case 'info':
            toast.info(value.message, options);
            break;
        case 'warning':
            toast.warning(value.message, options);
            break;
        default:
            toast.success(value.message, options);
    }
}

function isAdminPanelFlashToast(value: unknown): value is AdminPanelFlashToast {
    if (!value || typeof value !== 'object') {
        return false;
    }

    const toastValue = value as Partial<AdminPanelFlashToast>;

    return (
        typeof toastValue.message === 'string' &&
        ['success', 'info', 'warning', 'error'].includes(toastValue.type ?? '')
    );
}

const Toaster = ({ ...props }: ToasterProps) => {
    const theme = useDocumentTheme();

    useEffect(() => {
        return router.on('flash', (event) => {
            showFlashToast(event.detail.flash.toast);
        });
    }, []);

    return (
        <Sonner
            position="top-center"
            theme={theme}
            className="toaster group"
            closeButton
            icons={{
                success: (
                    <CircleCheckIcon className="size-4" />
                ),
                info: (
                    <InfoIcon className="size-4" />
                ),
                warning: (
                    <TriangleAlertIcon className="size-4 text-amber-600 dark:text-amber-400" />
                ),
                error: (
                    <OctagonXIcon className="size-4 text-red-600 dark:text-red-400" />
                ),
                loading: (
                    <Loader2Icon className="size-4 animate-spin text-muted-foreground" />
                ),
            }}
            style={
                {
                    '--normal-bg': 'var(--popover)',
                    '--normal-text': 'var(--popover-foreground)',
                    '--normal-border': 'var(--border)',
                    '--border-radius': 'var(--radius)',
                    '--toast-close-button-start': 'unset',
                    '--toast-close-button-end': '0',
                    '--toast-close-button-transform': 'translate(35%, -35%)',
                } as CSSProperties
            }
            toastOptions={{
                duration: 5000,
                classNames: {
                    toast: 'cn-toast',
                    warning:
                        '!border-amber-200 bg-amber-50 dark:!border-amber-800 dark:bg-amber-950/40',
                    error: '!border-red-200 bg-red-50 dark:!border-red-800 dark:bg-red-950/40',
                },
            }}
            {...props}
        />
    );
};

export { Toaster };
