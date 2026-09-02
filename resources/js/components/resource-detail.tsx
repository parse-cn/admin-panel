import { Deferred, router, usePage } from '@inertiajs/react';
import type { ResolvedComponent } from '@inertiajs/react';
import { createElement, lazy, Suspense } from 'react';
import type { ComponentType, LazyExoticComponent } from 'react';
import { Sheet, SheetContent } from '@admin-panel/ui/components/ui/sheet';
import CrudShowContent from '../pages/crud/show-content';
import type { CrudShowProps } from '@admin-panel/crud';
import CrudFormContent from '../pages/crud/form-content';
import type { CrudFormProps } from '@admin-panel/crud';
import { preserveCurrentQuery } from '@admin-panel/crud/lib/preserve-query';

type Detail = {
    component: string;
    props: Record<string, unknown>;
};

const packagePages = import.meta.glob<ResolvedComponent>(
    '/packages/*/resources/js/admin-pages/**/*.tsx',
);
const applicationPages = import.meta.glob<ResolvedComponent>([
    '/resources/js/admin/**/*.tsx',
    '!/resources/js/admin/**/components/**/*.tsx',
]);
const builtInPages = import.meta.glob<ResolvedComponent>('../pages/**/*.tsx');
function componentName(path: string): string {
    const roots = [
        '/resources/js/admin/',
        '/resources/js/admin-pages/',
        '../pages/',
    ];
    const root = roots.find((candidate) => path.includes(candidate));

    if (!root) {
        throw new Error(
            'An Admin Panel detail component path is not supported.',
        );
    }

    return path.slice(path.indexOf(root) + root.length).replace(/\.tsx$/, '');
}

const detailComponents = new Map<
    string,
    LazyExoticComponent<ComponentType<Record<string, unknown>>>
>();

for (const [path, loader] of [
    ...Object.entries(applicationPages),
    ...Object.entries(packagePages),
    ...Object.entries(builtInPages),
]) {
    detailComponents.set(
        componentName(path),
        lazy(async () => {
            const module = await loader();

            return {
                default: ('default' in module
                    ? module.default
                    : module) as ComponentType<Record<string, unknown>>,
            };
        }),
    );
}

export function ResourceDetailContent({
    component,
    presentation,
    props,
}: Detail & {
    presentation: 'page' | 'sheet';
}) {
    if (component === 'crud/show-content') {
        return (
            <CrudShowContent
                {...(props as CrudShowProps)}
                presentation={presentation}
            />
        );
    }

    if (component === 'crud/form-content') {
        return (
            <CrudFormContent
                {...(props as CrudFormProps)}
                presentation={presentation}
            />
        );
    }

    const Component = detailComponents.get(component);

    if (!Component) {
        throw new Error('The Admin Panel detail component was not found.');
    }

    return createElement(Component, { ...props, presentation });
}

export function ResourceDetailSheet() {
    const { createForm, createOpen, detail, detailId, edit, editId, routes } =
        usePage<{
            createForm?: Detail;
            createOpen?: boolean;
            detail?: Detail;
            detailId?: string;
            edit?: Detail;
            editId?: string;
            routes?: { index?: string };
        }>().props;
    const sheet = detailId
        ? { data: 'detail', detail }
        : editId
          ? { data: 'edit', detail: edit }
          : createOpen
            ? { data: 'createForm', detail: createForm }
            : null;

    if (!sheet || !routes?.index) {
        return null;
    }

    return (
        <Deferred data={sheet.data} fallback={<></>}>
            {sheet.detail ? (
                <Sheet
                    open
                    onOpenChange={(open: boolean) => {
                        if (!open) {
                            router.visit(preserveCurrentQuery(routes.index!), {
                                preserveScroll: true,
                                preserveState: true,
                            });
                        }
                    }}
                >
                    <SheetContent
                        side="right"
                        showCloseButton
                        className="flex flex-col gap-0 overflow-hidden rounded-xl p-0 outline-none data-[side=right]:inset-y-4 data-[side=right]:right-4 data-[side=right]:left-auto data-[side=right]:h-[calc(100svh-2rem)] data-[side=right]:w-[min(64rem,calc(100vw-2rem))] data-[side=right]:max-w-none max-sm:data-[side=right]:inset-y-0 max-sm:data-[side=right]:right-0 max-sm:data-[side=right]:h-svh max-sm:data-[side=right]:w-full max-sm:data-[side=right]:rounded-none data-[side=right]:sm:max-w-none"
                    >
                        <Suspense fallback={null}>
                            <ResourceDetailContent
                                {...sheet.detail}
                                presentation="sheet"
                            />
                        </Suspense>
                    </SheetContent>
                </Sheet>
            ) : null}
        </Deferred>
    );
}
