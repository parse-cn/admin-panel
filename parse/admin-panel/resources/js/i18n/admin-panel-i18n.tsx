import { router, usePage } from '@inertiajs/react';
import { createContext, useCallback, useContext, useMemo } from 'react';
import type { ReactNode } from 'react';
import type {
    AdminPanelI18n,
    AdminPanelPageProps,
    TranslationMessages,
} from '../types';

type Replacements = Record<string, number | string>;

type AdminPanelI18nContextValue = AdminPanelI18n & {
    setLocale: (locale: string) => void;
    t: (key: string, replacements?: Replacements) => string;
};

const AdminPanelI18nContext = createContext<AdminPanelI18nContextValue | null>(
    null,
);

function message(
    messages: TranslationMessages,
    key: string,
): string | undefined {
    let current: string | TranslationMessages = messages;

    for (const segment of key.split('.')) {
        if (typeof current === 'string' || !(segment in current)) {
            return undefined;
        }

        current = current[segment];
    }

    return typeof current === 'string' ? current : undefined;
}

export function translateMessage(
    messages: TranslationMessages,
    key: string,
    replacements: Replacements = {},
): string {
    const template = message(messages, key) ?? key;

    return Object.entries(replacements).reduce(
        (translated, [name, value]) =>
            translated.replaceAll(`:${name}`, String(value)),
        template,
    );
}

export function AdminPanelI18nProvider({ children }: { children: ReactNode }) {
    const { i18n } = usePage<AdminPanelPageProps>().props;
    const t = useCallback(
        (key: string, replacements: Replacements = {}) =>
            translateMessage(i18n.messages, key, replacements),
        [i18n.messages],
    );
    const setLocale = useCallback(
        (locale: string) => {
            if (
                locale === i18n.locale ||
                !i18n.supportedLocales.some(
                    (supported) => supported.locale === locale,
                )
            ) {
                return;
            }

            router.post(i18n.switchUrl, { locale }, { preserveScroll: true });
        },
        [i18n.locale, i18n.supportedLocales, i18n.switchUrl],
    );
    const value = useMemo(
        () => ({ ...i18n, setLocale, t }),
        [i18n, setLocale, t],
    );

    return (
        <AdminPanelI18nContext.Provider value={value}>
            {children}
        </AdminPanelI18nContext.Provider>
    );
}

export function useAdminPanelI18n(): AdminPanelI18nContextValue {
    const context = useContext(AdminPanelI18nContext);

    if (context === null) {
        throw new Error(
            'useAdminPanelI18n must be used within AdminPanelI18nProvider.',
        );
    }

    return context;
}
