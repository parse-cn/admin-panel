export type AdminPanelUser = {
    avatar: string | null;
    avatarPath?: string | null;
    email: string | null;
    name: string | null;
};

export type AdminPanelNavigation = {
    dashboard: string;
    globalSearch: {
        minimumQueryLength: number;
        url: string;
    };
    groups: Array<{
        items: Array<{
            active: boolean;
            badge: string | null;
            href: string;
            icon: string;
            label: string;
        }>;
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

export type TranslationMessages = {
    [key: string]: string | TranslationMessages;
};

export type AdminPanelI18n = {
    fallbackLocale: string;
    locale: string;
    messages: TranslationMessages;
    supportedLocales: Array<{
        label: string;
        locale: string;
    }>;
    switchUrl: string;
};

export type AdminPanelFlashToast = {
    description?: string;
    duration?: number;
    message: string;
    type: 'success' | 'info' | 'warning' | 'error';
};

export type AdminPanelPageProps = {
    [key: string]: unknown;
    auth: {
        user: AdminPanelUser | null;
    };
    flash?: {
        toast?: AdminPanelFlashToast;
    };
    i18n: AdminPanelI18n;
    navigation: AdminPanelNavigation;
    sidebarOpen: boolean;
    panel: {
        appShell: 'default' | 'app-shell-2' | 'app-shell-3';
        brand?: {
            favicon: string | null;
            logo: string | null;
            name: string;
        };
        id: string;
        theme?: Record<string, string>;
    };
    profile?: {
        email: string;
        name: string;
    };
    profileUpdateUrl?: string;
    passwordUpdateUrl?: string;
    avatarUploadUrl?: string;
    activeTab?: string;
    tabUrls?: Record<string, string>;
    translations?: Record<string, unknown>;
};
