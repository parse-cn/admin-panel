import { Link } from '@inertiajs/react';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import {
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@admin-panel/ui/components/ui/breadcrumb';
import type { AppShellParent } from '@admin-panel/ui';

type AdminPanelBreadcrumb = {
    label: string;
    parent?: AppShellParent;
};

type AdminPanelBreadcrumbContextValue = {
    breadcrumb?: AdminPanelBreadcrumb;
    setBreadcrumb: (breadcrumb?: AdminPanelBreadcrumb) => void;
};

const AdminPanelBreadcrumbContext =
    createContext<AdminPanelBreadcrumbContextValue | null>(null);

export function AdminPanelBreadcrumbProvider({
    children,
}: {
    children: ReactNode;
}) {
    const [breadcrumb, setBreadcrumb] = useState<
        AdminPanelBreadcrumb | undefined
    >();
    const value = useMemo(() => ({ breadcrumb, setBreadcrumb }), [breadcrumb]);

    return (
        <AdminPanelBreadcrumbContext.Provider value={value}>
            {children}
        </AdminPanelBreadcrumbContext.Provider>
    );
}

export function useAdminPanelBreadcrumb(
    breadcrumb?: AdminPanelBreadcrumb,
): void {
    const context = useContext(AdminPanelBreadcrumbContext);

    if (!context) {
        throw new Error(
            'useAdminPanelBreadcrumb must be used within AdminPanelBreadcrumbProvider.',
        );
    }

    const { setBreadcrumb } = context;
    const label = breadcrumb?.label;
    const parentHref = breadcrumb?.parent?.href;
    const parentTitle = breadcrumb?.parent?.title;

    useEffect(() => {
        setBreadcrumb(
            label
                ? {
                      label,
                      parent:
                          parentHref && parentTitle
                              ? { href: parentHref, title: parentTitle }
                              : undefined,
                  }
                : undefined,
        );

        return () => setBreadcrumb(undefined);
    }, [label, parentHref, parentTitle, setBreadcrumb]);
}

export function AdminPanelBreadcrumbTrail({
    parent,
    title,
}: {
    parent?: AppShellParent;
    title: string;
}) {
    const context = useContext(AdminPanelBreadcrumbContext);
    const breadcrumb = context?.breadcrumb;
    const resolvedParent = breadcrumb?.parent ?? parent;
    const resolvedTitle = breadcrumb?.label ?? title;

    return (
        <>
            {resolvedParent && (
                <>
                    <BreadcrumbItem className="hidden min-w-0 sm:inline-flex">
                        <BreadcrumbLink
                            render={<Link href={resolvedParent.href} />}
                        >
                            {resolvedParent.title}
                        </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator className="hidden items-center sm:flex">
                        <span className="inline-flex h-0.5 w-2 shrink-0 rounded-full bg-foreground/30" />
                    </BreadcrumbSeparator>
                </>
            )}
            <BreadcrumbItem className="min-w-0">
                <BreadcrumbPage className="truncate">
                    {resolvedTitle}
                </BreadcrumbPage>
            </BreadcrumbItem>
        </>
    );
}
