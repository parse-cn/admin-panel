import type { CSSProperties, ReactNode } from 'react';
import { cn } from '../../lib/utils';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarInset,
    SidebarProvider,
} from '../ui/sidebar';
import { TooltipProvider } from '../ui/tooltip';
import { AppShellBrand } from './app-shell-brand';
import { AppShellBreadcrumb } from './app-shell-breadcrumb';
import { AppShellNavMain, AppShellNavSearch } from './nav-main';
import { AppShellNavWorkspace } from './nav-workspace';
import { SidebarTrigger } from '../ui/sidebar';
import type { AppShellProps } from './types';

/**
 * The top-header shell, based on the layout used by the zz application.
 */
export function AppShellV3({
    accountMenu,
    brand,
    breadcrumb,
    children,
    contentClassName,
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
                    'flex flex-col',
                    '[--sidebar:var(--color-background)]',
                    '[--sidebar-accent:color-mix(in_oklab,var(--color-primary)_5%,transparent)]',
                    '[--sidebar-accent-foreground:var(--color-primary)]',
                    'h-dvh min-h-0 overflow-hidden',
                )}
                style={
                    {
                        '--sidebar-width': '260px',
                        '--sidebar-width-icon': '62px',
                        '--header-height': '50px',
                    } as CSSProperties
                }
            >
                <header className="sticky top-0 z-50 flex w-full shrink-0 items-center border-b bg-background">
                    <div className="flex h-(--header-height) w-full items-center gap-2 px-4">
                        <SidebarTrigger className="md:hidden" />
                        <div className="hidden items-center pl-0.5 md:flex">
                            <AppShellBrand brand={brand} />
                        </div>
                        <div className="min-w-0 flex-1">
                            <AppShellBreadcrumb
                                brand={brand}
                                breadcrumb={breadcrumb}
                                navigation={navigation}
                                parent={parent}
                                title={title}
                            />
                        </div>
                        {headerActions ? (
                            <div className="ml-auto flex items-center gap-1">
                                {headerActions}
                            </div>
                        ) : null}
                    </div>
                </header>

                <div className="flex min-h-0 flex-1 overflow-hidden">
                    <Sidebar
                        collapsible="icon"
                        className="top-(--header-height) h-[calc(100svh-var(--header-height))]!"
                    >
                        <SidebarHeader className="px-4 pt-3">
                            <AppShellNavSearch navigation={navigation} />
                        </SidebarHeader>
                        <SidebarContent className="gap-2 px-2">
                            <AppShellNavMain
                                mode={navigationMode}
                                navigation={navigation}
                            />
                        </SidebarContent>
                        <SidebarFooter className="px-4">
                            <AppShellNavWorkspace
                                accountMenu={accountMenu}
                                fallbackUserName={fallbackUserName}
                                language={language}
                                logoutUrl={navigation.logout}
                                themeStorageKey={themeStorageKey}
                                user={user}
                            />
                        </SidebarFooter>
                    </Sidebar>
                    <SidebarInset className="min-h-0 min-w-0 overflow-hidden">
                        <main
                            className={cn(
                                'flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto overscroll-contain px-4 py-5',
                                contentClassName,
                            )}
                        >
                            {children}
                        </main>
                    </SidebarInset>
                </div>
            </SidebarProvider>
        </TooltipProvider>
    );
}
