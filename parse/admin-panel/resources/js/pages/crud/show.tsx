import { Suspense } from 'react';
import { usePage } from '@inertiajs/react';
import type { CrudShowProps } from '@admin-panel/crud';
import { ResourceDetailContent } from '../../components/resource-detail';
import { AdminPanelLayout } from '../../layouts/admin-panel-layout';
import type { AdminPanelPageProps } from '../../types';

export default function CrudShowPage(
    props: CrudShowProps & { detailComponent: string },
) {
    const { auth, navigation } = usePage<AdminPanelPageProps>().props;

    return (
        <AdminPanelLayout
            navigation={navigation}
            parent={{
                href: props.routes.index,
                title: props.resource.title,
            }}
            title={props.resource.singularLabel}
            user={auth.user ?? { email: null, name: null }}
        >
            <Suspense fallback={null}>
                <ResourceDetailContent
                    component={props.detailComponent}
                    presentation="page"
                    props={props}
                />
            </Suspense>
        </AdminPanelLayout>
    );
}
