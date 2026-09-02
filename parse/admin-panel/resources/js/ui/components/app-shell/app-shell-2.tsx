import { cn } from '../../lib/utils';
import {
    Sidebar,
    SidebarContent,
    SidebarHeader,
    SidebarInset,
    SidebarFooter,
    SidebarProvider,
    SidebarTrigger,
} from '../ui/sidebar';
import { Separator } from '../ui/separator';
import { TooltipProvider } from '../ui/tooltip';
import { AppShellBrand } from './app-shell-brand';
import { AppShellHeader } from './app-shell-header';
import {
    AppShellNavSearch,
    AppShellNavMain,
    NavigationSearchProvider,
} from './nav-main';
import { AppShellNavWorkspace } from './nav-workspace';
import type { AppShellProps } from './types';

export function AppShellV2({
    accountMenu,
    brand,
    breadcrumb,
    children,
    contentClassName,
    fallbackUserName,
    headerActions,
    language,
    navigation,
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
                    '[&_[data-slot=sidebar-inner]]:border [&_[data-slot=sidebar-inner]]:border-border/80',
                    '[&_[data-slot=sidebar-inner]]:shadow-xs [&_[data-slot=sidebar-inner]]:shadow-black/5',
                    'h-dvh min-h-svh overflow-hidden',
                )}
            >
                <AppShellV2Sidebar
                    accountMenu={accountMenu}
                    brand={brand}
                    fallbackUserName={fallbackUserName}
                    language={language}
                    navigation={navigation}
                    themeStorageKey={themeStorageKey}
                    user={user}
                />
                <SidebarInset className="min-h-0 min-w-0 overflow-hidden">
                    <AppShellHeader
                        brand={brand}
                        breadcrumb={breadcrumb}
                        headerActions={headerActions}
                        navigation={navigation}
                        parent={parent}
                        title={title}
                    />
                    <main
                        className={cn(
                            'flex min-h-0 min-w-0 flex-1 flex-col gap-4 overflow-y-auto overscroll-contain px-4 py-3',
                            // contentClassName,
                        )}
                    >
                        {children}
                    </main>
                </SidebarInset>
            </SidebarProvider>
        </TooltipProvider>
    );
}

function AppShellV2Sidebar({
    accountMenu,
    brand,
    fallbackUserName,
    language,
    navigation,
    themeStorageKey,
    user,
}: Pick<
    AppShellProps,
    | 'accountMenu'
    | 'brand'
    | 'fallbackUserName'
    | 'language'
    | 'navigation'
    | 'themeStorageKey'
    | 'user'
>) {
    return (
        <NavigationSearchProvider>
            <Sidebar collapsible="icon" variant="floating">
                <SidebarHeader className="flex flex-col gap-2 in-data-[state=collapsed]:items-start in-data-[state=collapsed]:justify-center">
                    <div className="flex w-full flex-row items-center justify-between">
                        <AppShellBrand
                            brand={brand}
                            className="min-h-10 px-0.5"
                            nameClassName="in-data-[state=collapsed]:hidden"
                        />
                        <SidebarTrigger className="opacity-60 hover:opacity-100 [&_svg]:transition-transform [&_svg]:duration-200 in-data-[state=collapsed]:[&_svg]:rotate-180" />
                    </div>
                    <AppShellNavSearch
                        className="p-0"
                        navigation={navigation}
                    />
                </SidebarHeader>
                <SidebarContent>
                    <AppShellNavMain
                        mode="collapsible"
                        navigation={navigation}
                    />
                </SidebarContent>
                <SidebarFooter className="px-1! in-data-[state=collapsed]:px-1!">
                    <div className="px-2">
                        <Separator />
                    </div>
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
        </NavigationSearchProvider>
    );
}
