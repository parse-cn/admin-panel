import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';
import { SidebarTrigger } from '../ui/sidebar';
import { AppShellBreadcrumb } from './app-shell-breadcrumb';
import type {
    AppShellBrand,
    AppShellNavigation,
    AppShellParent,
} from './types';

export function AppShellHeader({
    brand,
    breadcrumb,
    headerActions,
    navigation,
    parent,
    separator,
    className,
    title,
}: {
    brand: AppShellBrand;
    breadcrumb?: ReactNode;
    headerActions?: ReactNode;
    navigation: AppShellNavigation;
    parent?: AppShellParent;
    separator?: 'bullet' | 'line';
    className?: string;
    title: string;
}) {
    return (
        <header
            className={cn(
                'flex min-h-12 shrink-0 items-center gap-2 py-2 transition-[width,height] ease-linear md:h-12 md:py-0',
                className,
            )}
        >
            <div className="flex min-w-0 flex-1 flex-wrap items-center justify-between gap-3 px-4">
                <SidebarTrigger className="-ml-1 opacity-60 hover:opacity-100 md:hidden" />
                <div className="min-w-0 flex-1">
                    <AppShellBreadcrumb
                        brand={brand}
                        breadcrumb={breadcrumb}
                        navigation={navigation}
                        parent={parent}
                        separator={separator}
                        title={title}
                    />
                </div>
                {headerActions}
            </div>
        </header>
    );
}
