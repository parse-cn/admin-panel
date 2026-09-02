import { Head, usePage } from '@inertiajs/react';
import { AdminPanelLayout } from '../../layouts/admin-panel-layout';
import { PageHeader } from '../../components/page-header/page-header';
import type { ProfilePageProps } from '../profile';
import { SecurityContent } from './security-content';
import { useAdminPanelI18n } from '../../i18n/admin-panel-i18n';

export default function ProfileSecurity() {
    const { auth, navigation, passwordUpdateUrl, tabUrls } =
        usePage<ProfilePageProps>().props;
    const { t } = useAdminPanelI18n();
    if (!auth.user || !navigation) return null;
    return (
        <AdminPanelLayout
            navigation={navigation}
            title={t('account.security')}
            user={auth.user}
        >
            <Head title={t('account.security')} />
            <div className="flex flex-col gap-6">
                <PageHeader
                    title={t('account.label')}
                    activeTab="security"
                    tabs={[
                        {
                            value: 'profile',
                            label: t('account.profile'),
                            href: tabUrls?.profile ?? '#',
                        },
                        {
                            value: 'preferences',
                            label: t('account.preferences'),
                            href: tabUrls?.preferences ?? '#',
                        },
                        {
                            value: 'security',
                            label: t('account.security'),
                            href: tabUrls?.security ?? '#',
                        },
                    ]}
                />
                <SecurityContent passwordUpdateUrl={passwordUpdateUrl} />
            </div>
        </AdminPanelLayout>
    );
}
