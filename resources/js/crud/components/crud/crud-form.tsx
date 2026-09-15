import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeftIcon } from 'lucide-react';
import type { FormEvent } from 'react';
import { useState } from 'react';
import { Button, FieldGroup, Frame, FrameDescription, FrameFooter, FrameHeader, FramePanel, FrameTitle } from '@admin-panel/ui';
import { useCrudI18n } from '../../i18n/crud-i18n';
import { CrudFormField } from './crud-form-field';
import type { CrudDefinition, CrudField, CrudFieldGroup, CrudFormData, CrudRecord, CrudRoutes } from './types';

export type { CrudFormData } from './types';

export type CrudFormProps = {
    resource: CrudDefinition;
    record: CrudRecord | null;
    routes: CrudRoutes;
    submit: { method: 'post' | 'put'; url: string };
    onCancel?: () => void;
    onSubmit?: (values: CrudFormData) => void | Promise<void>;
    submitErrors?: Record<string, string>;
    submitting?: boolean;
};

function initialValue(field: CrudField, value: unknown): string | string[] {
    if (field.type === 'boolean') return value === true || value === 1 || value === '1' ? '1' : '0';
    if (field.type === 'ip-list') return Array.isArray(value) ? value.map(String) : String(value ?? '').split(/[\n,]+/).map((item) => item.trim()).filter(Boolean);
    return String(value ?? '');
}

export function CrudForm({ resource, record, routes, submit, onCancel, onSubmit, submitErrors, submitting, presentation = 'page' }: CrudFormProps & { presentation?: 'page' | 'sheet' }) {
    const { t } = useCrudI18n();
    const fields = resource.fields.flatMap((item) => 'fields' in item ? item.fields : [item]);
    const form = useForm<CrudFormData>(Object.fromEntries(fields.map((field) => [field.name, initialValue(field, record?.values[field.name])] )));
    const [uploadingFields, setUploadingFields] = useState<Set<string>>(new Set());
    const editing = record !== null;
    const isSheet = presentation === 'sheet';
    const title = t(editing ? 'crud.form.edit_title' : 'crud.form.add_title', { resource: resource.singularLabel });
    const returnUrl = isSheet ? routes.index : record ? (routes.show ?? routes.index) : routes.index;
    const errors = submitErrors ?? form.errors;
    const isSubmitting = submitting ?? form.processing;

    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (onSubmit) void onSubmit(form.data);
        else if (submit.method === 'put') form.put(submit.url);
        else form.post(submit.url);
    }

    function setFieldUploading(field: string, uploading: boolean) {
        setUploadingFields((current) => {
            const next = new Set(current);
            uploading ? next.add(field) : next.delete(field);
            return next;
        });
    }

    const groupColumns: Record<CrudFieldGroup['columns'], string> = { 2: 'md:grid-cols-2', 3: 'md:grid-cols-3', 4: 'md:grid-cols-4' };
    const renderField = (field: CrudField) => <CrudFormField data={form.data} editing={editing} errors={errors} field={field} key={field.name} record={record} onChange={(name, value) => form.setData(name, value)} onUploadingChange={setFieldUploading} />;
    const fieldContent = <FieldGroup>{resource.fields.map((item, index) => 'fields' in item ? <div className={`grid grid-cols-1 gap-5 ${groupColumns[item.columns]}`} key={`field-group-${index}`}>{item.fields.map(renderField)}</div> : renderField(item))}</FieldGroup>;
    const actions = <>{onCancel ? <Button onClick={onCancel} type="button" variant="outline">{t('common.cancel')}</Button> : <Button nativeButton={false} render={<Link href={returnUrl} />} type="button" variant="outline">{t('common.cancel')}</Button>}<Button disabled={isSubmitting || uploadingFields.size > 0} type="submit">{isSubmitting ? t('crud.form.saving') : editing ? t('crud.form.save_changes') : t('crud.form.create', { resource: resource.singularLabel })}</Button></>;

    return <><>{presentation === 'page' && <Head title={title} />}</><div className={isSheet ? 'flex min-h-0 w-full flex-1 flex-col gap-0 overflow-hidden' : 'flex w-full flex-col gap-6'}>
        {!isSheet && <Link className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground" href={returnUrl}><ArrowLeftIcon aria-hidden="true" className="size-4" />{t('crud.form.back_to', { resource: editing ? resource.singularLabel : resource.title })}</Link>}
        <div className={isSheet ? 'shrink-0 border-b px-5 py-4 pr-16 sm:px-6' : 'flex flex-col gap-1'}><h1 className={isSheet ? 'text-lg font-semibold tracking-tight' : 'text-3xl font-semibold tracking-tight'}>{title}</h1><p className="text-sm text-muted-foreground">{t(editing ? 'crud.form.edit_description' : 'crud.form.create_description', { resource: resource.singularLabel })}</p></div>
        <form className={isSheet ? 'flex min-h-0 flex-1 flex-col' : undefined} onSubmit={handleSubmit}><div className={isSheet ? 'min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-6' : undefined}>{isSheet ? fieldContent : <Frame className="w-full" spacing="sm" variant="default"><FrameHeader><FrameTitle>{t('crud.form.details_title', { resource: resource.singularLabel })}</FrameTitle><FrameDescription className="text-xs">{t(editing ? 'crud.form.details_edit_description' : 'crud.form.details_create_description', { resource: resource.singularLabel })}</FrameDescription></FrameHeader><FramePanel>{fieldContent}</FramePanel></Frame>}</div><FrameFooter className={isSheet ? 'shrink-0 border-t px-5 py-4 sm:px-6' : 'mt-6'}>{actions}</FrameFooter></form>
    </div></>;
}
