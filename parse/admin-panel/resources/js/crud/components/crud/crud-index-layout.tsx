import type { ReactNode } from 'react';
import { PageHeader, PageHeaderStats } from '@admin-panel/components/page-header/page-header';
import type { CrudIndexHeader } from './types';

export function CrudIndexLayout({
    children,
    header,
}: {
    children: ReactNode;
    header?: CrudIndexHeader;
}) {
    if (!header) {
        return children;
    }

    return (
        <div className="flex w-full flex-col gap-6">
            <PageHeader title={header.title} description={header.description} tabs={header.tabs} activeTab={header.activeTab} />
            {header.stats && <PageHeaderStats stats={header.stats} />}

            {children}
        </div>
    );
}
