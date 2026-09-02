import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarTrigger,
} from '../ui/sidebar';
import { AppShellBrand } from './app-shell-brand';
import { AppShellNavMain, AppShellNavSearch } from './nav-main';
import { AppShellNavWorkspace } from './nav-workspace';
import type {
    AppShellAccountMenu,
    AppShellBrand as AppShellBrandProps,
    AppShellLanguage,
    AppShellNavigation,
    AppShellUser,
} from './types';

export function AppShellSidebar({
    accountMenu,
    brand,
    fallbackUserName,
    language,
    navigation,
    navigationMode,
    themeStorageKey,
    user,
}: {
    accountMenu?: AppShellAccountMenu;
    brand: AppShellBrandProps;
    fallbackUserName: string;
    language?: AppShellLanguage;
    navigation: AppShellNavigation;
    navigationMode?: 'sections' | 'collapsible';
    themeStorageKey: string;
    user: AppShellUser;
}) {
    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader className="flex flex-row items-center justify-between in-data-[state=collapsed]:flex-col in-data-[state=collapsed]:items-start in-data-[state=collapsed]:justify-center">
                <AppShellBrand
                    brand={brand}
                    className="min-h-10 px-0.5 transition-all duration-200 ease-linear"
                    nameClassName="in-data-[state=collapsed]:hidden"
                />

                <SidebarTrigger className="opacity-60 hover:opacity-100 [&_svg]:transition-transform [&_svg]:duration-200 in-data-[state=collapsed]:[&_svg]:rotate-180" />
            </SidebarHeader>

            <SidebarContent>
                <AppShellNavSearch navigation={navigation} />
                <AppShellNavMain
                    mode={navigationMode}
                    navigation={navigation}
                />
            </SidebarContent>

            <SidebarFooter>
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
    );
}
