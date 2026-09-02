import { cn } from '../../lib/utils';
import { SidebarInset, SidebarProvider } from '../ui/sidebar';
import { TooltipProvider } from '../ui/tooltip';
import { AppShellHeader } from './app-shell-header';
import { AppShellSidebar } from './app-sidebar';
import type { AppShellProps } from './types';

export function AppShell({
    accountMenu,
    brand,
    breadcrumb,
    children,
    fallbackUserName,
    headerActions,
    language,
    navigation,
    navigationMode,
    parent,
    sidebarDefaultOpen = true,
    themeStorageKey,
    title,
    user,
}: AppShellProps) {
    return (
        <TooltipProvider>
            <SidebarProvider
                defaultOpen={sidebarDefaultOpen}
                className={cn(
                    '[--sidebar-width:260px]',
                    '[--sidebar-border:transparent]',
                    'h-dvh min-h-svh overflow-hidden',
                )}
            >
                <AppShellSidebar
                    accountMenu={accountMenu}
                    brand={brand}
                    fallbackUserName={fallbackUserName}
                    language={language}
                    navigation={navigation}
                    navigationMode={navigationMode}
                    themeStorageKey={themeStorageKey}
                    user={user}
                />

                <SidebarInset className="ml-0! min-h-0 overflow-hidden">
                    <AppShellHeader
                        brand={brand}
                        breadcrumb={breadcrumb}
                        className="border-b border-border/60"
                        headerActions={headerActions}
                        navigation={navigation}
                        parent={parent}
                        separator="bullet"
                        title={title}
                    />

                    <main className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain px-4 py-5 sm:px-4 lg:px-4">
                        {children}
                    </main>
                </SidebarInset>
            </SidebarProvider>
        </TooltipProvider>
    );
}
