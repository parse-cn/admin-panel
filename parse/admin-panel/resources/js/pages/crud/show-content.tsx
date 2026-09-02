import { CrudShow } from '@admin-panel/crud';
import type { CrudShowProps } from '@admin-panel/crud';
import { useAdminPanelBreadcrumb } from '../../components/admin-panel-breadcrumb';

export default function CrudShowContent(
    props: CrudShowProps & { presentation?: 'page' | 'sheet' },
) {
    useAdminPanelBreadcrumb({
        label: props.record.title,
        parent: {
            href: props.routes.index,
            title: props.resource.title,
        },
    });

    return <CrudShow {...props} />;
}
