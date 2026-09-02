import { Head, usePage } from '@inertiajs/react';
import { Frame, FramePanel } from '@admin-panel/ui';
import { useAdminPanelI18n } from '../i18n/admin-panel-i18n';
import { AdminPanelLayout } from '../layouts/admin-panel-layout';
import type { AdminPanelPageProps } from '../types';

export default function Dashboard() {
    const { auth, navigation } = usePage<AdminPanelPageProps>().props;
    const user = auth.user ?? { email: null, name: null };
    const title =
        navigation.groups
            .flatMap((group) => group.items)
            .find((item) => item.href === navigation.dashboard)?.label ??
        'Dashboard';

    return (
        <AdminPanelLayout navigation={navigation} title={title} user={user}>
            <DashboardContent />
        </AdminPanelLayout>
    );
}

function DashboardContent() {
    const { t } = useAdminPanelI18n();
    const overviewItems = [
        {
            description: t('dashboard.resources_description'),
            icon: 'R',
            label: t('dashboard.resources'),
            value: '—',
        },
        {
            description: t('dashboard.administrators_description'),
            icon: 'A',
            label: t('dashboard.administrators'),
            value: '—',
        },
        {
            description: t('dashboard.activity_description'),
            icon: '↗',
            label: t('dashboard.activity'),
            value: '—',
        },
    ];

    return (
        <>
            <Head title={t('dashboard.title')} />

            <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-1">
                    <h1 className="text-2xl font-semibold tracking-tight">
                        {t('dashboard.title')}
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        {t('dashboard.description')}
                    </p>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                    {overviewItems.map((item) => (
                        <Frame key={item.label}>
                            <FramePanel className="flex min-h-40 flex-col justify-between gap-6 p-5">
                                <div className="flex items-center justify-between gap-4">
                                    <span className="text-sm font-medium">
                                        {item.label}
                                    </span>
                                    <span className="flex size-9 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                                        <span aria-hidden="true">
                                            {item.icon}
                                        </span>
                                    </span>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <strong className="text-3xl font-semibold tracking-tight">
                                        {item.value}
                                    </strong>
                                    <span className="text-sm text-muted-foreground">
                                        {item.description}
                                    </span>
                                </div>
                            </FramePanel>
                        </Frame>
                    ))}
                </div>

                <Frame>
                    <FramePanel className="flex min-h-72 flex-col items-center justify-center gap-3 p-8 text-center">
                        <span className="flex size-11 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                            <span aria-hidden="true">+</span>
                        </span>
                        <div className="flex max-w-md flex-col gap-1">
                            <h2 className="font-medium">
                                {t('dashboard.ready')}
                            </h2>
                            <p className="text-sm text-muted-foreground">
                                {t('dashboard.ready_description')}
                            </p>
                        </div>
                    </FramePanel>
                </Frame>
            </div>
        </>
    );
}
