import { createInertiaApp } from '@inertiajs/react';
import type { ResolvedComponent } from '@inertiajs/react';
import '../css/admin-panel.css';
import { Toaster } from './components/ui/sonner';
import { AdminPanelPersistentLayout } from './layouts/admin-panel-layout';

import.meta.glob('/resources/js/admin/*/account-menu.ts', { eager: true });

const packagePages = import.meta.glob<ResolvedComponent>(
    '/packages/*/resources/js/admin-pages/**/*.tsx',
);
const applicationPages = import.meta.glob<ResolvedComponent>([
    '/resources/js/admin/**/*.tsx',
    '!/resources/js/admin/**/components/**/*.tsx',
]);
const builtInPages = import.meta.glob<ResolvedComponent>('./pages/**/*.tsx');

function componentName(path: string): string {
    const roots = [
        '/resources/js/admin/',
        '/resources/js/admin-pages/',
        './pages/',
    ];
    const root = roots.find((candidate) => path.includes(candidate));

    if (!root) {
        throw new Error(`Admin Panel page path [${path}] is not supported.`);
    }

    return path.slice(path.indexOf(root) + root.length).replace(/\.tsx$/, '');
}

createInertiaApp({
    layout: (name) =>
        name === 'login' || name.endsWith('/login')
            ? null
            : AdminPanelPersistentLayout,
    resolve: (name) => {
        const candidates = [
            ...Object.entries(applicationPages),
            ...Object.entries(packagePages),
            ...Object.entries(builtInPages),
        ].filter(([path]) => componentName(path) === name);

        if (candidates.length !== 1) {
            throw new Error(
                candidates.length === 0
                    ? `Admin Panel page [${name}] was not found.`
                    : `Admin Panel page [${name}] is registered more than once.`,
            );
        }

        return candidates[0][1]();
    },
    strictMode: true,
    withApp(app) {
        return (
            <>
                {app}
                <Toaster />
            </>
        );
    },
});
