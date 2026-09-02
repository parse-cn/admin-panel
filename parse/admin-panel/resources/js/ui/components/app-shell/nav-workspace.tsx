import { useEffect, useState } from 'react';
import { router } from '@inertiajs/react';
import {
    ChevronsUpDownIcon,
    MonitorIcon,
    MoonIcon,
    PaletteIcon,
    SunIcon,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useHydrated } from '../../hooks/use-hydrated';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Button } from '../ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuShortcut,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { RemixIcon } from '../ui/remix-icon';
import {
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from '../ui/sidebar';
import type {
    AppShellAccountMenu,
    AppShellLanguage,
    AppShellUser,
} from './types';

type Theme = 'light' | 'dark' | 'system';

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
            className="inline-flex items-center gap-0.5 rounded-full bg-muted/60 p-0.5"
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
                        size="icon-xs"
                        onClick={() => setTheme(value)}
                        className={cn(
                            'rounded-full',
                            isActive
                                ? 'bg-background text-foreground shadow-sm'
                                : 'text-muted-foreground hover:text-foreground',
                        )}
                    >
                        {icon}
                    </Button>
                );
            })}
        </div>
    );
}

function initials(user: AppShellUser, fallbackName: string): string {
    const source = user.name ?? user.email ?? fallbackName;

    return source.slice(0, 2).toUpperCase();
}

export function AppShellNavWorkspace({
    accountMenu,
    fallbackUserName,
    language,
    logoutUrl,
    themeStorageKey,
    user,
}: {
    accountMenu?: AppShellAccountMenu;
    fallbackUserName: string;
    language?: AppShellLanguage;
    logoutUrl: string;
    themeStorageKey: string;
    user: AppShellUser;
}) {
    const { isMobile } = useSidebar();
    const displayName = user.name ?? user.email ?? fallbackUserName;
    const hydrated = useHydrated();
    const [theme, setTheme] = useState<Theme>('system');

    useEffect(() => {
        if (!hydrated) {
            return;
        }

        const storedTheme = window.localStorage.getItem(themeStorageKey);

        if (storedTheme === 'light' || storedTheme === 'dark') {
            // Hydration must start from the server-safe system value. Reading
            // the persisted preference is intentionally deferred to the client.
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setTheme(storedTheme);
        }
    }, [hydrated, themeStorageKey]);

    useEffect(() => {
        if (!hydrated) {
            return;
        }

        const colorScheme = window.matchMedia('(prefers-color-scheme: dark)');
        const applyTheme = () => {
            const isDark =
                theme === 'dark' || (theme === 'system' && colorScheme.matches);

            document.documentElement.classList.toggle('dark', isDark);
            document.documentElement.style.colorScheme = isDark
                ? 'dark'
                : 'light';
        };

        if (theme === 'system') {
            window.localStorage.removeItem(themeStorageKey);
            colorScheme.addEventListener('change', applyTheme);
        } else {
            window.localStorage.setItem(themeStorageKey, theme);
        }

        applyTheme();

        return () => colorScheme.removeEventListener('change', applyTheme);
    }, [hydrated, theme, themeStorageKey]);

    const currentTheme = hydrated ? theme : 'system';

    const nextTheme: Theme =
        currentTheme === 'system'
            ? 'light'
            : currentTheme === 'light'
              ? 'dark'
              : 'system';
    const labels: AppShellAccountMenu = accountMenu ?? {
        items: [
            {
                disabled: true,
                icon: 'user-line',
                key: 'profile',
                label: 'Profile',
                shortcut: 'Soon',
            },
            {
                disabled: true,
                icon: 'settings-3-line',
                key: 'preferences',
                label: 'Preferences',
                shortcut: 'Soon',
            },
        ],
        label: 'Account',
        openMenu: 'Open account menu',
        signOut: 'Sign out',
        theme: 'Theme',
        themeStatus: (current, next) =>
            `${current} active, activate to switch to ${next}`,
        themes: { dark: 'Dark', light: 'Light', system: 'System' },
    };
    const themeLabel = labels.themes[currentTheme];
    const nextThemeLabel = labels.themes[nextTheme];

    return (
        <SidebarMenu>
            <SidebarMenuItem>
                <DropdownMenu>
                    <DropdownMenuTrigger
                        render={
                            <SidebarMenuButton
                                size="lg"
                                className="group-data-[collapsible=icon]:justify-center data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                                aria-label={labels.openMenu}
                            />
                        }
                    >
                        <Avatar className="size-7 rounded-md">
                            <AvatarImage
                                src={user.avatar ?? undefined}
                                alt={displayName}
                            />
                            <AvatarFallback className="rounded-md bg-primary text-xs font-semibold text-primary-foreground">
                                {initials(user, fallbackUserName)}
                            </AvatarFallback>
                        </Avatar>
                        <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                            <span className="truncate font-medium">
                                {displayName}
                            </span>
                            <span className="truncate text-xs text-muted-foreground">
                                {user.email ?? fallbackUserName}
                            </span>
                        </div>
                        <ChevronsUpDownIcon
                            className="ml-auto size-4 opacity-50 group-data-[collapsible=icon]:hidden"
                            aria-hidden="true"
                        />
                    </DropdownMenuTrigger>

                    <DropdownMenuContent
                        side={isMobile ? 'bottom' : 'right'}
                        align="end"
                        sideOffset={4}
                        className="w-56"
                    >
                        <DropdownMenuGroup>
                            <DropdownMenuLabel className="flex items-center gap-2.5 py-2">
                                <Avatar className="size-8 rounded-md">
                                    <AvatarImage
                                        src={user.avatar ?? undefined}
                                        alt={displayName}
                                    />
                                    <AvatarFallback className="rounded-md bg-primary text-xs font-semibold text-primary-foreground">
                                        {initials(user, fallbackUserName)}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex min-w-0 flex-col">
                                    <span className="text-sm font-semibold text-foreground">
                                        {displayName}
                                    </span>
                                    <span className="truncate text-xs font-normal text-muted-foreground">
                                        {user.email ?? fallbackUserName}
                                    </span>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {labels.items?.map((item) => (
                                <DropdownMenuItem
                                    key={item.key}
                                    disabled={
                                        item.disabled ||
                                        (!item.href && !item.onSelect)
                                    }
                                    onClick={() => {
                                        if (item.onSelect) {
                                            item.onSelect();

                                            return;
                                        }

                                        if (item.href) {
                                            router.visit(item.href);
                                        }
                                    }}
                                >
                                    <RemixIcon name={item.icon} />
                                    {item.label}
                                    {item.shortcut && (
                                        <DropdownMenuShortcut>
                                            {item.shortcut}
                                        </DropdownMenuShortcut>
                                    )}
                                </DropdownMenuItem>
                            ))}
                            <DropdownMenuItem
                                className="cursor-default focus:bg-transparent!"
                                onSelect={(event) => event.preventDefault()}
                            >
                                <PaletteIcon aria-hidden="true" />
                                {labels.theme}
                                <span className="sr-only">
                                    {labels.themeStatus(
                                        themeLabel,
                                        nextThemeLabel,
                                    )}
                                </span>
                                <div className="ml-auto">
                                    <ThemeSegmentedToggle
                                        labels={labels.themes}
                                        setTheme={setTheme}
                                        theme={currentTheme}
                                    />
                                </div>
                            </DropdownMenuItem>
                            {language && language.options.length > 1 && (
                                <DropdownMenuSub>
                                    <DropdownMenuSubTrigger>
                                        <RemixIcon name="translate-2" />
                                        {language.label}
                                    </DropdownMenuSubTrigger>
                                    <DropdownMenuSubContent
                                        className="min-w-40"
                                        side={isMobile ? 'top' : 'right'}
                                    >
                                        <DropdownMenuRadioGroup
                                            value={language.locale}
                                            onValueChange={language.onChange}
                                        >
                                            {language.options.map((option) => (
                                                <DropdownMenuRadioItem
                                                    key={option.locale}
                                                    value={option.locale}
                                                >
                                                    {option.label}
                                                </DropdownMenuRadioItem>
                                            ))}
                                        </DropdownMenuRadioGroup>
                                    </DropdownMenuSubContent>
                                </DropdownMenuSub>
                            )}
                        </DropdownMenuGroup>

                        <DropdownMenuSeparator />

                        <DropdownMenuItem
                            onClick={() => router.delete(logoutUrl)}
                        >
                            <RemixIcon name="logout-box-r-line" />
                            {labels.signOut}
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarMenuItem>
        </SidebarMenu>
    );
}
