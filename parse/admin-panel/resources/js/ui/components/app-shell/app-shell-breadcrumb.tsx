import { Link } from '@inertiajs/react';
import type { ReactNode } from 'react';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '../ui/breadcrumb';
import { RemixIcon } from '../ui/remix-icon';
import type {
    AppShellBrand,
    AppShellNavigation,
    AppShellParent,
} from './types';

function BulletSeparator() {
    return (
        <span className="inline-flex h-0.5 w-2 shrink-0 rounded-full bg-foreground/30" />
    );
}

export function AppShellBreadcrumb({
    breadcrumb,
    navigation,
    parent,
    separator = 'line',
    title,
}: {
    brand: AppShellBrand;
    breadcrumb?: ReactNode;
    navigation: AppShellNavigation;
    parent?: AppShellParent;
    separator?: 'bullet' | 'line';
    title: string;
}) {
    const separatorContent =
        separator === 'bullet' ? <BulletSeparator /> : undefined;

    return (
        <Breadcrumb>
            <BreadcrumbList>
                <BreadcrumbItem className="hidden items-center md:flex">
                    <BreadcrumbLink
                        className="flex items-center gap-1.5"
                        render={<Link href={navigation.dashboard} />}
                    >
                        <RemixIcon name="home-4-line" />
                    </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden items-center md:flex">
                    {separatorContent}
                </BreadcrumbSeparator>
                {breadcrumb ?? (
                    <>
                        {parent && (
                            <>
                                <BreadcrumbItem>
                                    <BreadcrumbLink
                                        render={<Link href={parent.href} />}
                                    >
                                        {parent.title}
                                    </BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator
                                    className={
                                        separator === 'bullet'
                                            ? 'hidden items-center md:flex'
                                            : undefined
                                    }
                                >
                                    {separatorContent}
                                </BreadcrumbSeparator>
                            </>
                        )}
                        <BreadcrumbItem>
                            <BreadcrumbPage>{title}</BreadcrumbPage>
                        </BreadcrumbItem>
                    </>
                )}
            </BreadcrumbList>
        </Breadcrumb>
    );
}
