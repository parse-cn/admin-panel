import { usePage } from '@inertiajs/react';
import { CrudIndex, CrudIndexLayout } from '@admin-panel/crud';
import type { CrudIndexProps } from '@admin-panel/crud';
import { AdminPanelLayout } from '../../layouts/admin-panel-layout';
import type { AdminPanelPageProps } from '../../types';

export default function CrudIndexPage(props: CrudIndexProps) {
    const { auth, navigation } = usePage<AdminPanelPageProps>().props;

    return (
        <AdminPanelLayout
            contentClassName={props.indexHeader ? 'pt-0 pb-5' : undefined}
            navigation={navigation}
            title={props.resource.title}
            user={auth.user ?? { email: null, name: null }}
        >
            <CrudIndexLayout header={props.indexHeader}>
                <CrudIndex {...props} />
            </CrudIndexLayout>
        </AdminPanelLayout>
    );
}
