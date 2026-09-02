import { CrudForm } from '@admin-panel/crud';
import type { CrudFormProps } from '@admin-panel/crud';

export default function CrudFormContent(
    props: CrudFormProps & { presentation?: 'page' | 'sheet' },
) {
    return <CrudForm {...props} />;
}
