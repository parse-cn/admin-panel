import type { ReactNode } from 'react';

export type AppShellUser = {
    avatar?: string | null;
    email: string | null;
    name: string | null;
};

export type AppShellNavigationItem = {
    active: boolean;
    badge: string | null;
    href: string;
    icon: string;
    label: string;
};

export type AppShellNavigation = {
    dashboard: string;
    globalSearch: {
        minimumQueryLength: number;
        url: string;
    };
    groups: Array<{
        items: AppShellNavigationItem[];
        label: string;
        section: string;
        sectionSort: number;
    }>;
    labels: {
        keyboardHint: string;
        loadError: string;
        loading: string;
        noResults: string;
        search: string;
        searchResults: string;
        startTyping: string;
    };
    logout: string;
};

export type AppShellBrand = {
    logo: string | null;
    name: string;
};

export type AppShellParent = {
    href: string;
    title: string;
};

export type AppShellLanguage = {
    label: string;
    locale: string;
    onChange: (locale: string) => void;
    options: Array<{
        label: string;
        locale: string;
    }>;
};

export type AppShellAccountMenuItem = {
    disabled?: boolean;
    href?: string;
    icon: string;
    key: string;
    label: string;
    onSelect?: () => void;
    shortcut?: string;
};

export type AppShellAccountMenu = {
    items?: AppShellAccountMenuItem[];
    label: string;
    openMenu: string;
    signOut: string;
    theme: string;
    themeStatus: (current: string, next: string) => string;
    themes: Record<'dark' | 'light' | 'system', string>;
};

export type AppShellProps = {
    brand: AppShellBrand;
    accountMenu?: AppShellAccountMenu;
    breadcrumb?: ReactNode;
    children: ReactNode;
    contentClassName?: string;
    fallbackUserName: string;
    headerActions?: ReactNode;
    language?: AppShellLanguage;
    navigation: AppShellNavigation;
    navigationMode?: 'sections' | 'collapsible';
    parent?: AppShellParent;
    sidebarDefaultOpen?: boolean;
    themeStorageKey: string;
    title: string;
    user: AppShellUser;
};
