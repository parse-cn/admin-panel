import type { AppShellAccountMenuItem } from '@admin-panel/ui';
import type { AdminPanelPageProps } from './types';

type AccountMenuContext = {
    props: AdminPanelPageProps;
    t: (key: string, replacements?: Record<string, number | string>) => string;
};

type AccountMenuFactory = (
    context: AccountMenuContext,
) => AppShellAccountMenuItem[];

const accountMenus = new Map<string, AccountMenuFactory>();

export function registerAdminPanelAccountMenu(
    panel: string,
    factory: AccountMenuFactory,
): void {
    accountMenus.set(panel, factory);
}

export function resolveAdminPanelAccountMenu(
    panel: string,
    context: AccountMenuContext,
): AppShellAccountMenuItem[] | undefined {
    return accountMenus.get(panel)?.(context);
}
