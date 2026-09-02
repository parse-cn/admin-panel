import { Link } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { RemixIcon } from '../ui/remix-icon';
import { GlobalSearch } from '../reui/global-search';
import {
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuBadge,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
    useSidebar,
} from '../ui/sidebar';
import type { AppShellNavigation, AppShellNavigationItem } from './types';

type NavigationMode = 'sections' | 'collapsible';
type NavigationGroup = AppShellNavigation['groups'][number];

export function NavigationSearchProvider({
    children,
}: {
    children: ReactNode;
}) {
    return children;
}

export function AppShellNavSearch({
    className,
    navigation,
}: {
    className?: string;
    navigation: AppShellNavigation;
}) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const { state } = useSidebar();

    return (
        <>
            <SidebarGroup className={cn('px-2 pb-0', className)}>
                <SidebarGroupContent>
                    <GlobalSearch
                        collapsed={state === 'collapsed'}
                        description={navigation.labels.searchResults}
                        labels={navigation.labels}
                        minimumQueryLength={
                            navigation.globalSearch.minimumQueryLength
                        }
                        onOpenChange={setOpen}
                        onQueryChange={setQuery}
                        open={open}
                        placeholder={navigation.labels.search}
                        query={query}
                        searchUrl={navigation.globalSearch.url}
                    />
                </SidebarGroupContent>
            </SidebarGroup>
        </>
    );
}

export function AppShellNavMain({
    mode = 'sections',
    navigation,
}: {
    mode?: NavigationMode;
    navigation: AppShellNavigation;
}) {
    if (mode === 'collapsible') {
        return <CollapsibleNavigation navigation={navigation} />;
    }

    return <SectionNavigation navigation={navigation} />;
}

function NavigationLink({ item }: { item: AppShellNavigationItem }) {
    return (
        <SidebarMenuItem>
            <SidebarMenuButton
                isActive={item.active}
                render={<Link href={item.href} />}
                tooltip={item.label}
            >
                <RemixIcon name={item.icon} />
                <span>{item.label}</span>
            </SidebarMenuButton>
            {item.badge && (
                <SidebarMenuBadge className="right-1.5 h-4 min-w-0 px-1 text-[9px] font-normal tracking-wide text-muted-foreground/55">
                    {item.badge}
                </SidebarMenuBadge>
            )}
        </SidebarMenuItem>
    );
}

function SectionNavigation({ navigation }: { navigation: AppShellNavigation }) {
    return (
        <>
            {navigation.groups.map((group) => (
                <SidebarGroup key={group.label}>
                    <SidebarGroupLabel className="in-data-[state=collapsed]:hidden">
                        {group.label}
                    </SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {group.items.map((item) => (
                                <NavigationLink item={item} key={item.href} />
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            ))}
        </>
    );
}

function CollapsibleNavigation({
    navigation,
}: {
    navigation: AppShellNavigation;
}) {
    const sections = useMemo(() => {
        const groupedSections = new Map<
            string,
            { groups: NavigationGroup[]; label: string; sort: number }
        >();

        navigation.groups.forEach((group) => {
            const section = groupedSections.get(group.section);

            if (section) {
                section.groups.push(group);
            } else {
                groupedSections.set(group.section, {
                    groups: [group],
                    label: group.section,
                    sort: group.sectionSort,
                });
            }
        });

        return Array.from(groupedSections.values()).sort(
            (left, right) => left.sort - right.sort,
        );
    }, [navigation.groups]);

    return (
        <>
            {sections.map((section) => (
                <SidebarGroup key={section.label}>
                    <SidebarGroupLabel className="in-data-[state=collapsed]:hidden">
                        {section.label}
                    </SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {section.groups.map((group) =>
                                group.items.length === 1 ? (
                                    group.items.map((item) => (
                                        <NavigationLink
                                            item={item}
                                            key={item.href}
                                        />
                                    ))
                                ) : (
                                    <NavigationModule
                                        group={group}
                                        key={group.label}
                                    />
                                ),
                            )}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            ))}
        </>
    );
}

function NavigationModule({ group }: { group: NavigationGroup }) {
    const { state } = useSidebar();
    const isActive = group.items.some((item) => item.active);
    const icon = group.items[0]?.icon ?? 'folder-line';
    const [open, setOpen] = useState(isActive);
    const [lastActive, setLastActive] = useState(isActive);

    if (isActive !== lastActive) {
        setLastActive(isActive);

        if (isActive) {
            setOpen(true);
        }
    }

    if (state === 'collapsed') {
        return (
            <SidebarMenuItem>
                <DropdownMenu>
                    <DropdownMenuTrigger
                        render={
                            <SidebarMenuButton
                                isActive={isActive}
                                tooltip={group.label}
                            />
                        }
                    >
                        <RemixIcon
                            className={
                                isActive
                                    ? 'text-primary opacity-100'
                                    : undefined
                            }
                            name={icon}
                        />
                        <span>{group.label}</span>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        align="start"
                        className="w-56"
                        side="right"
                        sideOffset={8}
                    >
                        <DropdownMenuGroup>
                            <DropdownMenuLabel>{group.label}</DropdownMenuLabel>
                            {group.items.map((item) => (
                                <DropdownMenuItem
                                    className={
                                        item.active
                                            ? 'bg-accent text-accent-foreground'
                                            : undefined
                                    }
                                    key={item.href}
                                    render={<Link href={item.href} />}
                                >
                                    <span className="min-w-0 flex-1 truncate">
                                        {item.label}
                                    </span>
                                    {item.badge && (
                                        <span className="ml-auto shrink-0 text-[9px] font-normal tracking-wide text-muted-foreground/50">
                                            {item.badge}
                                        </span>
                                    )}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuGroup>
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarMenuItem>
        );
    }

    return (
        <SidebarMenuItem>
            <SidebarMenuButton
                isActive={isActive}
                tooltip={group.label}
                onClick={() => setOpen((previous) => !previous)}
                aria-expanded={open}
                aria-controls={`subnav-${group.label}`}
            >
                <RemixIcon
                    className={
                        isActive ? 'text-primary opacity-100' : undefined
                    }
                    name={icon}
                />
                <span>{group.label}</span>
                <RemixIcon
                    className={`ml-auto transition-transform duration-200 ${open ? 'rotate-90' : ''}`}
                    name="arrow-right-s-line"
                />
            </SidebarMenuButton>
            {open && (
                <SidebarMenuSub
                    className="border-border/70"
                    id={`subnav-${group.label}`}
                >
                    {group.items.map((item) => (
                        <SidebarMenuSubItem key={item.href}>
                            <SidebarMenuSubButton
                                className="gap-2 pr-1"
                                isActive={item.active}
                                render={<Link href={item.href} />}
                            >
                                <span className="min-w-0 flex-1 truncate whitespace-nowrap">
                                    {item.label}
                                </span>
                                {item.badge && (
                                    <span className="ml-auto shrink-0 px-1 text-[9px] leading-none font-normal tracking-wide whitespace-nowrap text-muted-foreground/50">
                                        {item.badge}
                                    </span>
                                )}
                            </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                    ))}
                </SidebarMenuSub>
            )}
        </SidebarMenuItem>
    );
}
