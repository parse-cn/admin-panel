import { CheckIcon, MonitorIcon, MoonIcon, SunIcon } from 'lucide-react';
import { usePage } from '@inertiajs/react';
import { useEffect, useState, type ReactNode } from 'react';
import {
    Frame,
    FrameDescription,
    FrameHeader,
    FramePanel,
    FrameTitle,
} from '@admin-panel/ui/components/reui/frame';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@admin-panel/ui/components/ui/select';
import { Button } from '@admin-panel/ui/components/ui/button';
import { cn } from '@admin-panel/ui/lib/utils';
import type { AdminPanelPageProps } from '../../types';
import { useAdminPanelI18n } from '../../i18n/admin-panel-i18n';

type Theme = 'system' | 'light' | 'dark';
type Layout = 'default' | 'app-shell-2' | 'app-shell-3';

const BRAND_COLORS = [
    { name: 'Default', value: 'default' },
    { name: 'Indigo', value: '#6366f1' },
    { name: 'Rose', value: '#f43f5e' },
    { name: 'Orange', value: '#f97316' },
    { name: 'Violet', value: '#8b5cf6' },
    { name: 'Emerald', value: '#10b981' },
    { name: 'Sky', value: '#0ea5e9' },
] as const;
type BrandColor = (typeof BRAND_COLORS)[number]['value'];

export function PreferencesContent() {
    const { props } = usePage<AdminPanelPageProps>();
    const { locale, setLocale, supportedLocales, t } = useAdminPanelI18n();
    const [theme, setTheme] = useState<Theme>(() => {
        if (typeof window === 'undefined') return 'system';
        const value = window.localStorage.getItem('parse-admin-panel-theme');
        return value === 'light' || value === 'dark' ? value : 'system';
    });
    const [layout, setLayout] = useState<Layout>(() =>
        typeof window !== 'undefined' &&
        (window.localStorage.getItem('parse-admin-panel-app-shell') ===
            'app-shell-2' ||
            window.localStorage.getItem('parse-admin-panel-app-shell') ===
                'app-shell-3' ||
            window.localStorage.getItem('parse-admin-panel-app-shell') ===
                'default')
            ? (window.localStorage.getItem(
                  'parse-admin-panel-app-shell',
              ) as Layout)
            : props.panel.appShell,
    );
    const [brandColor, setBrandColor] = useState<BrandColor>(() => {
        if (typeof window === 'undefined') return 'default';
        const value = window.localStorage.getItem(
            'parse-admin-panel-brand-color',
        );
        return BRAND_COLORS.some((color) => color.value === value)
            ? (value as BrandColor)
            : 'default';
    });

    useEffect(() => {
        const dark =
            theme === 'dark' ||
            (theme === 'system' &&
                window.matchMedia('(prefers-color-scheme: dark)').matches);
        document.documentElement.classList.toggle('dark', dark);
        if (theme === 'system')
            window.localStorage.removeItem('parse-admin-panel-theme');
        else window.localStorage.setItem('parse-admin-panel-theme', theme);
    }, [theme]);

    useEffect(() => {
        window.localStorage.setItem('parse-admin-panel-app-shell', layout);
        window.dispatchEvent(
            new CustomEvent('admin-panel-app-shell-change', {
                detail: layout,
            }),
        );
    }, [layout]);

    useEffect(() => {
        const root = document.documentElement;
        if (brandColor === 'default') {
            root.style.removeProperty('--primary');
            root.style.removeProperty('--primary-foreground');
            root.style.removeProperty('--ring');
            root.style.removeProperty('--sidebar-primary');
            root.style.removeProperty('--sidebar-ring');
            window.localStorage.removeItem('parse-admin-panel-brand-color');

            return;
        }

        root.style.setProperty('--primary', brandColor);
        root.style.setProperty('--primary-foreground', '#ffffff');
        root.style.setProperty('--ring', brandColor);
        root.style.setProperty('--sidebar-primary', brandColor);
        root.style.setProperty('--sidebar-ring', brandColor);
        window.localStorage.setItem(
            'parse-admin-panel-brand-color',
            brandColor,
        );
    }, [brandColor]);

    return (
        <div className="flex w-full flex-col gap-4">
            <PreferenceSection
                title={t('account.display')}
                description={t('account.display_description')}
            >
                <PreferenceRow label={t('account.theme')}>
                    <ThemeSegmentedToggle
                        theme={theme}
                        setTheme={setTheme}
                        labels={{
                            light: t('account.themes.light'),
                            dark: t('account.themes.dark'),
                            system: t('account.themes.system'),
                        }}
                    />
                </PreferenceRow>
                <PreferenceRow label={t('locale.label')}>
                    <Select
                        value={locale}
                        onValueChange={(value) => value && setLocale(value)}
                    >
                        <SelectTrigger className="w-40">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {supportedLocales.map((supported) => (
                                <SelectItem
                                    key={supported.locale}
                                    value={supported.locale}
                                >
                                    {supported.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </PreferenceRow>
                <PreferenceRow label={t('account.layout')}>
                    <Select
                        value={layout}
                        onValueChange={(value) =>
                            value && setLayout(value as Layout)
                        }
                    >
                        <SelectTrigger className="w-40">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="default">
                                {t('account.layout_default')}
                            </SelectItem>
                            <SelectItem value="app-shell-2">
                                {t('account.layout_app_shell_2')}
                            </SelectItem>
                            <SelectItem value="app-shell-3">
                                {t('account.layout_app_shell_3')}
                            </SelectItem>
                        </SelectContent>
                    </Select>
                </PreferenceRow>
                <PreferenceRow label={t('account.primary_color')}>
                    <div className="flex items-center gap-3">
                        {BRAND_COLORS.map((color) => (
                            <button
                                key={color.value}
                                type="button"
                                aria-label={color.name}
                                aria-pressed={brandColor === color.value}
                                onClick={() => setBrandColor(color.value)}
                                className={cn(
                                    'flex size-7 items-center justify-center rounded-full transition-shadow',
                                    brandColor === color.value &&
                                        'ring-2 ring-ring ring-offset-2 ring-offset-background',
                                )}
                                style={{
                                    backgroundColor:
                                        color.value === 'default'
                                            ? 'var(--foreground)'
                                            : color.value,
                                }}
                            >
                                {brandColor === color.value ? (
                                    <CheckIcon
                                        className="size-3 text-white"
                                        aria-hidden="true"
                                    />
                                ) : null}
                            </button>
                        ))}
                    </div>
                </PreferenceRow>
            </PreferenceSection>
        </div>
    );
}

function ThemeSegmentedToggle({
    labels,
    setTheme,
    theme,
}: {
    labels: Record<Theme, string>;
    setTheme: (theme: Theme) => void;
    theme: Theme;
}) {
    const options = [
        {
            value: 'light' as const,
            icon: <SunIcon className="size-3.5" aria-hidden="true" />,
        },
        {
            value: 'dark' as const,
            icon: <MoonIcon className="size-3.5" aria-hidden="true" />,
        },
        {
            value: 'system' as const,
            icon: <MonitorIcon className="size-3.5" aria-hidden="true" />,
        },
    ];

    return (
        <div
            role="radiogroup"
            aria-label={labels.system}
            className="flex w-full max-w-sm items-center gap-1 rounded-lg border bg-muted/30 p-1 sm:w-auto"
        >
            {options.map(({ value, icon }) => {
                const isActive = theme === value;

                return (
                    <Button
                        key={value}
                        type="button"
                        role="radio"
                        aria-checked={isActive}
                        aria-label={labels[value]}
                        variant="ghost"
                        size="sm"
                        onClick={() => setTheme(value)}
                        className={cn(
                            'min-w-0 flex-1 gap-1.5 px-2.5 text-xs sm:flex-none sm:px-3',
                            isActive
                                ? 'bg-background text-foreground shadow-sm'
                                : 'text-muted-foreground hover:text-foreground',
                        )}
                    >
                        {icon}
                        <span>{labels[value]}</span>
                    </Button>
                );
            })}
        </div>
    );
}

function PreferenceSection({
    title,
    description,
    children,
}: {
    title: string;
    description: string;
    children: ReactNode;
}) {
    return (
        <Frame spacing="sm">
            <FrameHeader className="px-4 py-3">
                <FrameTitle>{title}</FrameTitle>
                <FrameDescription>{description}</FrameDescription>
            </FrameHeader>
            <FramePanel className="divide-y p-0">{children}</FramePanel>
        </Frame>
    );
}
function PreferenceRow({
    label,
    children,
}: {
    label: string;
    children: ReactNode;
}) {
    return (
        <div className="flex items-center justify-between gap-4 px-4 py-3">
            <p className="text-sm font-medium">{label}</p>
            {children}
        </div>
    );
}
