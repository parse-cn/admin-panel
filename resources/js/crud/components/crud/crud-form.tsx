import { Head, Link, useForm, useHttp } from '@inertiajs/react';
import { ArrowLeftIcon } from 'lucide-react';
import type { FormEvent } from 'react';
import { useEffect, useState } from 'react';
import {
    Frame,
    FrameDescription,
    FrameFooter,
    FrameHeader,
    FramePanel,
    FrameTitle,
} from '@admin-panel/ui';
import { Button } from '@admin-panel/ui';
import { FileUpload } from '@admin-panel/ui';
import { Field, FieldError, FieldGroup, FieldLabel } from '@admin-panel/ui';
import { Input } from '@admin-panel/ui';
import { Switch } from '@admin-panel/ui';
import { Textarea } from '@admin-panel/ui';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@admin-panel/ui';
import { useCrudI18n } from '../../i18n/crud-i18n';
import type {
    CrudCredentialOption,
    CrudDefinition,
    CrudField,
    CrudFieldGroup,
    CrudRecord,
    CrudRoutes,
} from './types';

export type CrudFormProps = {
    resource: CrudDefinition;
    record: CrudRecord | null;
    routes: CrudRoutes;
    submit: {
        method: 'post' | 'put';
        url: string;
    };
    onCancel?: () => void;
    onSubmit?: (values: Record<string, string>) => void | Promise<void>;
    submitErrors?: Record<string, string>;
    submitting?: boolean;
};

type UploadResponse = {
    path: string;
    url: string;
};

function fieldError(
    errors: Record<string, string>,
    fieldName: string,
): string | undefined {
    const messages = Object.entries(errors)
        .filter(([key]) => key === fieldName || key.startsWith(`${fieldName}.`))
        .map(([, message]) => message);

    return [...new Set(messages)].join(' ') || undefined;
}

function parseKeyValue(value: string): Record<string, string> {
    if (value === '') {
        return {};
    }

    try {
        const parsed: unknown = JSON.parse(value);

        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
            return {};
        }

        return Object.fromEntries(
            Object.entries(parsed).map(([key, item]) => [
                key,
                String(item ?? ''),
            ]),
        );
    } catch {
        return {};
    }
}

type CrudKeyValueFieldProps = {
    field: CrudField;
    provider: string;
    value: string;
    onChange: (value: string) => void;
};

function CrudKeyValueField({
    field,
    provider,
    value,
    onChange,
}: CrudKeyValueFieldProps) {
    const definitions: CrudCredentialOption[] =
        field.credentialOptions?.[provider] ?? [];
    const values = parseKeyValue(value);

    function setValue(key: string, nextValue: string) {
        const allowedKeys = new Set(
            definitions.map((definition) => definition.key),
        );

        onChange(
            JSON.stringify(
                Object.fromEntries(
                    Object.entries({ ...values, [key]: nextValue }).filter(
                        ([name]) => allowedKeys.has(name),
                    ),
                ),
            ),
        );
    }

    if (provider === '') {
        return (
            <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                Select a provider to configure credentials.
            </div>
        );
    }

    if (definitions.length === 0) {
        return (
            <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                This provider does not require credentials.
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4 rounded-lg border p-4">
            {definitions.map((definition) => {
                const isMultiline =
                    definition.key.includes('private') ||
                    definition.key.includes('public');

                return (
                    <div
                        className="grid gap-2 md:grid-cols-[minmax(10rem,0.4fr)_minmax(0,1fr)] md:items-start"
                        key={definition.key}
                    >
                        <div className="flex flex-col gap-1 pt-2">
                            <span className="font-mono text-sm">
                                {definition.key}
                            </span>
                            {definition.optional && (
                                <span className="text-xs text-muted-foreground">
                                    Optional
                                </span>
                            )}
                        </div>
                        {isMultiline ? (
                            <Textarea
                                className="min-h-28 font-mono"
                                value={values[definition.key] ?? ''}
                                onChange={(event) =>
                                    setValue(definition.key, event.target.value)
                                }
                            />
                        ) : (
                            <Input
                                type="password"
                                value={values[definition.key] ?? ''}
                                onChange={(event) =>
                                    setValue(definition.key, event.target.value)
                                }
                            />
                        )}
                    </div>
                );
            })}
        </div>
    );
}

type CrudImageFieldProps = {
    currentUrl: string;
    field: CrudField;
    onChange: (path: string) => void;
    onUploadingChange: (uploading: boolean) => void;
    value: string;
};

function CrudImageField({
    currentUrl,
    field,
    onChange,
    onUploadingChange,
    value,
}: CrudImageFieldProps) {
    const { t } = useCrudI18n();
    const [selectedPreview, setSelectedPreview] = useState<string | null>(null);
    const upload = useHttp<{ file: File | null }, UploadResponse>({
        file: null,
    });

    useEffect(
        () => () => {
            if (selectedPreview?.startsWith('blob:')) {
                URL.revokeObjectURL(selectedPreview);
            }
        },
        [selectedPreview],
    );

    function handleChange(file: File) {
        if (!field.uploadUrl) {
            return;
        }

        setSelectedPreview(URL.createObjectURL(file));
        onUploadingChange(true);
        upload.transform(() => ({ file }));
        void upload
            .post(field.uploadUrl, {
                onSuccess: (response) => {
                    setSelectedPreview(response.url);
                    onChange(response.path);
                },
                onError: () => setSelectedPreview(null),
                onFinish: () => onUploadingChange(false),
            })
            .catch(() => undefined);
    }

    const previewUrl = selectedPreview || currentUrl;

    return (
        <FileUpload
            accept="image/jpeg,image/png,image/webp"
            disabled={upload.processing}
            error={upload.errors.file ? String(upload.errors.file) : undefined}
            fileName={value ? value.split('/').at(-1) : undefined}
            maxSizeLabel="2 MB"
            labels={{
                title: t('crud.upload.title'),
                description: t('crud.upload.description'),
                requirements: (size) => t('crud.upload.requirements', { size }),
                select: t('crud.upload.select'),
                uploaded: t('crud.upload.uploaded'),
                complete: t('crud.upload.complete'),
                uploading: (progress) =>
                    t('crud.upload.uploading', { progress }),
                remove: t('crud.upload.remove'),
            }}
            previewUrl={previewUrl || undefined}
            progress={
                upload.processing
                    ? (upload.progress?.percentage ?? 0)
                    : undefined
            }
            onFileSelect={handleChange}
            onClear={
                value || selectedPreview
                    ? () => {
                          setSelectedPreview(null);
                          onChange('');
                      }
                    : undefined
            }
        />
    );
}

export function CrudForm({
    resource,
    record,
    routes,
    submit,
    onCancel,
    onSubmit,
    submitErrors,
    submitting,
    presentation = 'page',
}: CrudFormProps & { presentation?: 'page' | 'sheet' }) {
    const { booleanOptions, t, translateOptionLabel } = useCrudI18n();
    const fields = resource.fields.flatMap((item) =>
        'fields' in item ? item.fields : [item],
    );
    const initialValues = Object.fromEntries(
        fields.map((field) => {
            const value = record?.values[field.name];

            if (field.type === 'boolean') {
                return [
                    field.name,
                    value === true || value === 1 || value === '1' ? '1' : '0',
                ];
            }

            return [field.name, String(value ?? '')];
        }),
    );
    const form = useForm<Record<string, string>>(initialValues);
    const [uploadingFields, setUploadingFields] = useState<Set<string>>(
        new Set(),
    );
    const editing = record !== null;
    const isSheet = presentation === 'sheet';
    const title = t(editing ? 'crud.form.edit_title' : 'crud.form.add_title', {
        resource: resource.singularLabel,
    });
    const returnUrl = isSheet
        ? routes.index
        : record
          ? (routes.show ?? routes.index)
          : routes.index;
    const errors = submitErrors ?? form.errors;
    const isSubmitting = submitting ?? form.processing;

    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (onSubmit) {
            void onSubmit(form.data);

            return;
        }

        if (submit.method === 'put') {
            form.put(submit.url);
        } else {
            form.post(submit.url);
        }
    }

    function setFieldUploading(field: string, uploading: boolean) {
        setUploadingFields((current) => {
            const next = new Set(current);

            if (uploading) {
                next.add(field);
            } else {
                next.delete(field);
            }

            return next;
        });
    }

    function renderField(field: CrudField) {
        const error = fieldError(errors, field.name);

        return (
            <Field data-invalid={Boolean(error)} key={field.name}>
                <FieldLabel htmlFor={`crud-${field.name}`}>
                    {field.label}
                    {(field.required ||
                        (!editing && field.requiredOnCreate)) && (
                        <span className="text-destructive">*</span>
                    )}
                </FieldLabel>

                {field.type === 'image-url' ? (
                    <div className="flex flex-col gap-3">
                        {form.data[field.name] && (
                            <div className="flex h-32 items-center justify-center overflow-hidden rounded-lg border bg-muted/30 p-4">
                                <img
                                    alt=""
                                    className="h-full w-full object-contain"
                                    src={form.data[field.name]}
                                />
                            </div>
                        )}
                        <Input
                            aria-invalid={Boolean(error)}
                            id={`crud-${field.name}`}
                            onChange={(event) =>
                                form.setData(field.name, event.target.value)
                            }
                            placeholder={field.placeholder}
                            type="text"
                            value={String(form.data[field.name] ?? '')}
                        />
                    </div>
                ) : field.type === 'image' ? (
                    <CrudImageField
                        currentUrl={
                            field.preview
                                ? String(record?.values[field.preview] ?? '')
                                : ''
                        }
                        field={field}
                        value={form.data[field.name]}
                        onChange={(path) => form.setData(field.name, path)}
                        onUploadingChange={(uploading) =>
                            setFieldUploading(field.name, uploading)
                        }
                    />
                ) : field.type === 'textarea' ? (
                    <Textarea
                        aria-invalid={Boolean(error)}
                        className="min-h-40 font-mono"
                        id={`crud-${field.name}`}
                        onChange={(event) =>
                            form.setData(field.name, event.target.value)
                        }
                        placeholder={field.placeholder}
                        required={
                            field.required ||
                            (!editing && field.requiredOnCreate)
                        }
                        value={String(form.data[field.name] ?? '')}
                    />
                ) : field.type === 'key-value' ? (
                    <CrudKeyValueField
                        field={field}
                        provider={String(form.data.provider ?? '')}
                        value={String(form.data[field.name] ?? '')}
                        onChange={(value) => form.setData(field.name, value)}
                    />
                ) : field.type === 'boolean' ? (
                    <div className="flex h-9 items-center gap-3">
                        <Switch
                            aria-label={field.label}
                            checked={form.data[field.name] === '1'}
                            id={`crud-${field.name}`}
                            name={field.name}
                            onCheckedChange={(checked) =>
                                form.setData(field.name, checked ? '1' : '0')
                            }
                        />
                        <span className="text-sm text-muted-foreground">
                            {
                                booleanOptions[
                                    form.data[field.name] === '1' ? 1 : 0
                                ].label
                            }
                        </span>
                    </div>
                ) : field.type === 'select' ? (
                    <Select
                        items={(field.options ?? []).map((option) => ({
                            label: translateOptionLabel(option.label),
                            value: option.value,
                        }))}
                        name={field.name}
                        value={String(form.data[field.name] ?? '')}
                        onValueChange={(value) => {
                            form.setData(field.name, value ?? '');

                            if (field.name === 'provider') {
                                form.setData('credentials', '');
                            }
                        }}
                        required={field.required}
                    >
                        <SelectTrigger
                            id={`crud-${field.name}`}
                            className="w-full"
                            aria-invalid={Boolean(error)}
                        >
                            <SelectValue
                                placeholder={
                                    field.placeholder ??
                                    t('crud.form.select_placeholder', {
                                        field: field.label,
                                    })
                                }
                            />
                        </SelectTrigger>
                        <SelectContent
                            align="start"
                            alignItemWithTrigger={false}
                        >
                            {(field.options ?? []).map((option) => (
                                <SelectItem
                                    key={option.value}
                                    value={option.value}
                                >
                                    {translateOptionLabel(option.label)}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                ) : (
                    <Input
                        id={`crud-${field.name}`}
                        type={field.type}
                        value={String(form.data[field.name] ?? '')}
                        onChange={(event) =>
                            form.setData(field.name, event.target.value)
                        }
                        placeholder={field.placeholder}
                        required={
                            field.required ||
                            (!editing && field.requiredOnCreate)
                        }
                        autoComplete={
                            field.type === 'password'
                                ? 'new-password'
                                : undefined
                        }
                        aria-invalid={Boolean(error)}
                    />
                )}

                <FieldError>{error}</FieldError>
            </Field>
        );
    }

    const groupColumns: Record<CrudFieldGroup['columns'], string> = {
        2: 'md:grid-cols-2',
        3: 'md:grid-cols-3',
        4: 'md:grid-cols-4',
    };
    const actions = (
        <>
            {onCancel ? (
                <Button type="button" variant="outline" onClick={onCancel}>
                    {t('common.cancel')}
                </Button>
            ) : (
                <Button
                    nativeButton={false}
                    render={<Link href={returnUrl} />}
                    type="button"
                    variant="outline"
                >
                    {t('common.cancel')}
                </Button>
            )}
            <Button
                type="submit"
                disabled={isSubmitting || uploadingFields.size > 0}
            >
                {isSubmitting
                    ? t('crud.form.saving')
                    : editing
                      ? t('crud.form.save_changes')
                      : t('crud.form.create', {
                            resource: resource.singularLabel,
                        })}
            </Button>
        </>
    );
    const fieldContent = (
        <FieldGroup>
            {resource.fields.map((item, index) =>
                'fields' in item ? (
                    <div
                        className={`grid grid-cols-1 gap-5 ${groupColumns[item.columns]}`}
                        key={`field-group-${index}`}
                    >
                        {item.fields.map(renderField)}
                    </div>
                ) : (
                    renderField(item)
                ),
            )}
        </FieldGroup>
    );

    return (
        <>
            {presentation === 'page' && <Head title={title} />}

            <div
                className={
                    isSheet
                        ? 'flex min-h-0 w-full flex-1 flex-col gap-0 overflow-hidden'
                        : 'flex w-full flex-col gap-6'
                }
            >
                {!isSheet && (
                    <Link
                        className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
                        href={returnUrl}
                    >
                        <ArrowLeftIcon className="size-4" aria-hidden="true" />
                        {t('crud.form.back_to', {
                            resource: editing
                                ? resource.singularLabel
                                : resource.title,
                        })}
                    </Link>
                )}

                <div
                    className={
                        isSheet
                            ? 'shrink-0 border-b px-5 py-4 pr-16 sm:px-6'
                            : 'flex flex-col gap-1'
                    }
                >
                    <h1
                        className={
                            isSheet
                                ? 'text-lg font-semibold tracking-tight'
                                : 'text-3xl font-semibold tracking-tight'
                        }
                    >
                        {title}
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        {t(
                            editing
                                ? 'crud.form.edit_description'
                                : 'crud.form.create_description',
                            { resource: resource.singularLabel },
                        )}
                    </p>
                </div>

                <form
                    className={
                        isSheet ? 'flex min-h-0 flex-1 flex-col' : undefined
                    }
                    onSubmit={handleSubmit}
                >
                    <div
                        className={
                            isSheet
                                ? 'min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-6'
                                : undefined
                        }
                    >
                        {isSheet ? (
                            fieldContent
                        ) : (
                            <Frame
                                variant="default"
                                spacing="sm"
                                className="w-full"
                            >
                                <FrameHeader>
                                    <FrameTitle>
                                        {t('crud.form.details_title', {
                                            resource: resource.singularLabel,
                                        })}
                                    </FrameTitle>
                                    <FrameDescription className="text-xs">
                                        {t(
                                            editing
                                                ? 'crud.form.details_edit_description'
                                                : 'crud.form.details_create_description',
                                            {
                                                resource:
                                                    resource.singularLabel,
                                            },
                                        )}
                                    </FrameDescription>
                                </FrameHeader>

                                <FramePanel className="bg-card p-6! shadow-none!">
                                    {fieldContent}
                                </FramePanel>

                                <FrameFooter className="flex-row justify-end gap-2">
                                    {actions}
                                </FrameFooter>
                            </Frame>
                        )}
                    </div>
                    {isSheet && (
                        <footer className="flex shrink-0 justify-end gap-2 border-t bg-muted/60 px-5 py-4 sm:px-6">
                            <div className="flex shrink-0 flex-wrap items-center gap-2">
                                {actions}
                            </div>
                        </footer>
                    )}
                </form>
            </div>
        </>
    );
}
