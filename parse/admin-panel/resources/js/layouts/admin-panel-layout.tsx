import { setLayoutProps, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { AppShell, AppShellV2, AppShellV3 } from '@admin-panel/ui';
import type { AppShellAccountMenuItem, AppShellParent } from '@admin-panel/ui';
import { resolveAdminPanelAccountMenu } from '../account-menu';
import {
    AdminPanelBreadcrumbProvider,
    AdminPanelBreadcrumbTrail,
} from '../components/admin-panel-breadcrumb';
import { ResourceDetailSheet } from '../components/resource-detail';
import { TopLoader } from '../components/top-loader';
import { AdminPanelI18nProvider } from '../i18n/admin-panel-i18n';
import { useAdminPanelI18n } from '../i18n/admin-panel-i18n';
import type { AdminPanelPageProps, AdminPanelUser } from '../types';

type AdminPanelLayoutProps = {
    accountMenuItems?: AppShellAccountMenuItem[];
    children: ReactNode;
    contentClassName?: string;
    headerActions?: ReactNode;
    navigation: AdminPanelPageProps['navigation'];
    parent?: AppShellParent;
    title: string;
    user: AdminPanelUser;
};

function resolveThemeVariables(
    theme: Record<string, string> | undefined,
): Record<string, string> {
    return Object.fromEntries(
        Object.entries(theme ?? {}).flatMap(([name, value]) => {
            const cssName = name.replaceAll('_', '-');

            return [
                [`--${cssName}`, value],
                [`--color-${cssName}`, value],
            ];
        }),
    );
}

export function AdminPanelLayout({
    accountMenuItems,
    children,
    contentClassName,
    headerActions,
    parent,
    title,
}: AdminPanelLayoutProps) {
    setLayoutProps<AdminPanelPersistentLayoutProps>({
        accountMenuItems,
        contentClassName,
        headerActions,
        parent,
        title,
    });

    return children;
}

export type AdminPanelPersistentLayoutProps = {
    accountMenuItems?: AppShellAccountMenuItem[];
    children: ReactNode;
    contentClassName?: string;
    headerActions?: ReactNode;
    parent?: AppShellParent;
    title?: string;
};

export function AdminPanelPersistentLayout({
    accountMenuItems,
    children,
    contentClassName,
    headerActions,
    parent,
    title,
}: AdminPanelPersistentLayoutProps) {
    return (
        <AdminPanelI18nProvider>
            <AdminPanelBreadcrumbProvider>
                <TopLoader />
                <LocalizedAdminPanelLayout
                    accountMenuItems={accountMenuItems}
                    contentClassName={contentClassName}
                    headerActions={headerActions}
                    parent={parent}
                    title={title}
                >
                    {children}
                </LocalizedAdminPanelLayout>
            </AdminPanelBreadcrumbProvider>
        </AdminPanelI18nProvider>
    );
}

function LocalizedAdminPanelLayout({
    accountMenuItems,
    children,
    contentClassName,
    headerActions,
    parent,
    title,
}: AdminPanelPersistentLayoutProps) {
    const { props } = usePage<AdminPanelPageProps>();
    const { panel, sidebarOpen } = props;
    const [appShell, setAppShell] = useState(panel.appShell);

    useEffect(() => {
        setAppShell(panel.appShell);

        const storedAppShell = window.localStorage.getItem(
            'parse-admin-panel-app-shell',
        );

        if (
            storedAppShell === 'default' ||
            storedAppShell === 'app-shell-2' ||
            storedAppShell === 'app-shell-3'
        ) {
            setAppShell(storedAppShell);
        }

        const handleAppShellChange = (event: Event) => {
            const value = (event as CustomEvent<string>).detail;

            if (
                value === 'default' ||
                value === 'app-shell-2' ||
                value === 'app-shell-3'
            ) {
                setAppShell(value);
            }
        };

        window.addEventListener(
            'admin-panel-app-shell-change',
            handleAppShellChange,
        );

        return () =>
            window.removeEventListener(
                'admin-panel-app-shell-change',
                handleAppShellChange,
            );
    }, [panel.appShell]);

    const Shell =
        appShell === 'app-shell-3'
            ? AppShellV3
            : appShell === 'app-shell-2'
              ? AppShellV2
              : AppShell;
    const themeVariables = useMemo(
        () => resolveThemeVariables(panel.theme),
        [panel.theme],
    );

    useEffect(() => {
        const root = document.documentElement;
        const previousValues = new Map<string, string>();

        Object.entries(themeVariables).forEach(([name, value]) => {
            previousValues.set(name, root.style.getPropertyValue(name));
            root.style.setProperty(name, value);
        });

        return () => {
            previousValues.forEach((value, name) => {
                if (value) {
                    root.style.setProperty(name, value);
                } else {
                    root.style.removeProperty(name);
                }
            });
        };
    }, [themeVariables]);

    useEffect(() => {
        const storedPrimaryColor = window.localStorage.getItem(
            'parse-admin-panel-brand-color',
        );

        if (
            !storedPrimaryColor ||
            !/^#[0-9a-f]{6}$/i.test(storedPrimaryColor)
        ) {
            return;
        }

        const root = document.documentElement;
        root.style.setProperty('--primary', storedPrimaryColor);
        root.style.setProperty('--primary-foreground', '#ffffff');
        root.style.setProperty('--ring', storedPrimaryColor);
        root.style.setProperty('--sidebar-primary', storedPrimaryColor);
        root.style.setProperty('--sidebar-ring', storedPrimaryColor);
    }, []);

    const { locale, setLocale, supportedLocales, t } = useAdminPanelI18n();
    const resolvedTitle = title ?? panel.brand?.name ?? t('panel.default_name');
    const registeredAccountMenuItems = resolveAdminPanelAccountMenu(panel.id, {
        props,
        t,
    });

    return (
        <div className="contents" style={themeVariables as CSSProperties}>
            <Shell
                accountMenu={{
                    label: t('account.label'),
                    openMenu: t('account.open_menu'),
                    items: accountMenuItems ??
                        registeredAccountMenuItems ?? [
                            {
                                disabled: true,
                                icon: 'user-line',
                                key: 'profile',
                                label: t('account.profile'),
                                shortcut: t('account.soon'),
                            },
                            {
                                disabled: true,
                                icon: 'settings-3-line',
                                key: 'preferences',
                                label: t('account.preferences'),
                                shortcut: t('account.soon'),
                            },
                        ],
                    signOut: t('account.sign_out'),
                    theme: t('account.theme'),
                    themeStatus: (current, next) =>
                        t('account.theme_status', { current, next }),
                    themes: {
                        dark: t('account.themes.dark'),
                        light: t('account.themes.light'),
                        system: t('account.themes.system'),
                    },
                }}
                brand={
                    panel.brand ?? {
                        logo: null,
                        name: t('panel.default_name'),
                    }
                }
                breadcrumb={
                    <AdminPanelBreadcrumbTrail
                        parent={parent}
                        title={resolvedTitle}
                    />
                }
                contentClassName={contentClassName}
                fallbackUserName={t('account.fallback_name')}
                headerActions={headerActions}
                language={{
                    label: t('locale.label'),
                    locale,
                    onChange: setLocale,
                    options: supportedLocales,
                }}
                navigation={props.navigation}
                navigationMode={
                    panel.id === 'admin' || panel.id === 'merchant'
                        ? 'collapsible'
                        : 'sections'
                }
                parent={parent}
                sidebarDefaultOpen={sidebarOpen}
                themeStorageKey="parse-admin-panel-theme"
                title={resolvedTitle}
                user={props.auth.user ?? { email: null, name: null }}
            >
                {children}
                <ResourceDetailSheet />
            </Shell>
        </div>
    );
}
