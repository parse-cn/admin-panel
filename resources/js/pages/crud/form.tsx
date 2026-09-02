import { usePage } from '@inertiajs/react';
import { CrudForm } from '@admin-panel/crud';
import type { CrudFormProps } from '@admin-panel/crud';
import { translateMessage } from '../../i18n/admin-panel-i18n';
import { AdminPanelLayout } from '../../layouts/admin-panel-layout';
import type { AdminPanelPageProps } from '../../types';

export default function CrudFormPage(props: CrudFormProps) {
    const { auth, i18n, navigation } = usePage<AdminPanelPageProps>().props;
    const editing = props.record !== null;
    const title = translateMessage(
        i18n.messages,
        editing ? 'crud.form.edit_title' : 'crud.form.add_title',
        { resource: props.resource.singularLabel },
    );

    return (
        <AdminPanelLayout
            navigation={navigation}
            parent={{
                href: props.routes.index,
                title: props.resource.title,
            }}
            title={title}
            user={auth.user ?? { email: null, name: null }}
        >
            <CrudForm {...props} />
        </AdminPanelLayout>
    );
}
