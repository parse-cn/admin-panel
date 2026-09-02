import { Link } from '@inertiajs/react';
import { Frame, FramePanel } from '@admin-panel/ui';
import { Tabs, TabsList, TabsTrigger } from '@admin-panel/ui/components/ui/tabs';

export type PageHeaderTab = { value: string; label: string; href: string };
export type PageHeaderStat = {
    key: string;
    label: string;
    value?: string | number;
    description?: string;
    tone?: 'default' | 'success' | 'warning' | 'danger';
    details?: Array<{ label: string; value: string | number }>;
};

const tones = {
    default: 'bg-muted text-foreground',
    success: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
    warning: 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
    danger: 'bg-red-500/10 text-red-700 dark:text-red-300',
} as const;

export function PageHeader({
    title,
    description,
    tabs,
    activeTab,
    tabsVariant = 'line',
}: {
    title?: string;
    description?: string;
    tabs?: PageHeaderTab[];
    activeTab?: string;
    tabsVariant?: 'line' | 'segmented';
}) {
    if (!title && !description && !tabs?.length) return null;
    return (
        <div className="flex flex-col gap-2">
            {title && (
                <h1 className="text-xl font-semibold tracking-tight">
                    {title}
                </h1>
            )}
            {description && (
                <p className="text-sm text-muted-foreground">{description}</p>
            )}
            {tabs?.length ? (
                <Tabs
                    value={activeTab ?? tabs[0].value}
                    className="w-full flex-col! gap-0"
                >
                    <TabsList
                        variant={tabsVariant === 'line' ? 'line' : undefined}
                        className={
                            tabsVariant === 'line'
                                ? 'h-auto w-full justify-start gap-6 bg-transparent'
                                : 'h-10 w-full gap-1 bg-muted p-1'
                        }
                    >
                        {tabs.map((tab) => (
                            <TabsTrigger
                                key={tab.value}
                                value={tab.value}
                                nativeButton={false}
                                render={<Link href={tab.href} />}
                                className={
                                    tabsVariant === 'line'
                                        ? 'flex-none justify-start px-0 py-2 text-base after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-primary after:opacity-0 after:transition-opacity data-active:after:opacity-100'
                                        : 'flex-1 justify-center px-3 py-1.5 text-sm'
                                }
                            >
                                {tab.label}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                </Tabs>
            ) : null}
        </div>
    );
}

export function PageHeaderStats({ stats }: { stats: PageHeaderStat[] }) {
    if (!stats.length) return null;
    return (
        <div
            className={`grid gap-4 sm:grid-cols-2 ${stats.length <= 2 ? 'lg:grid-cols-2' : 'md:grid-cols-3 lg:grid-cols-4'}`}
        >
            {stats.map((stat) => (
                <Frame key={stat.key}>
                    <FramePanel className="flex flex-col gap-2 p-4!">
                        <span className="text-sm text-muted-foreground">
                            {stat.label}
                        </span>
                        {stat.details?.length ? (
                            <div className="grid gap-2 sm:grid-cols-2">
                                {stat.details.map((detail) => (
                                    <div
                                        key={detail.label}
                                        className="flex min-w-0 flex-col gap-0.5"
                                    >
                                        <span className="text-xs text-muted-foreground">
                                            {detail.label}
                                        </span>
                                        <strong className="truncate text-2xl font-semibold tracking-tight">
                                            {detail.value}
                                        </strong>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex items-end justify-between gap-3">
                                <strong className="text-2xl font-semibold tracking-tight">
                                    {stat.value ?? '—'}
                                </strong>
                            </div>
                        )}
                        {stat.description && (
                            <span
                                className={`rounded-full px-2 py-1 text-xs font-medium ${tones[stat.tone ?? 'default']}`}
                            >
                                {stat.description}
                            </span>
                        )}
                    </FramePanel>
                </Frame>
            ))}
        </div>
    );
}
