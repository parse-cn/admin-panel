import { Field, FieldError, FieldLabel } from '@admin-panel/ui';
import type { ReactNode } from 'react';
import { useCrudI18n } from '../../i18n/crud-i18n';
import { BooleanField } from './fields/boolean-field';
import { ImageField } from './fields/image-field';
import { ImageUrlField } from './fields/image-url-field';
import { IpListField } from './fields/ip-list-field';
import { JsonField } from './fields/json-field';
import { KeyValueField } from './fields/key-value-field';
import { SelectField } from './fields/select-field';
import { TextareaField } from './fields/textarea-field';
import { TextField } from './fields/text-field';
import type { CrudField, CrudFormData, CrudRecord } from './types';

type Props = {
  data: CrudFormData;
  editing: boolean;
  errors: Record<string, string>;
  field: CrudField;
  record: CrudRecord | null;
  onChange: (name: string, value: string | string[]) => void;
  onUploadingChange: (name: string, uploading: boolean) => void;
};

function errorFor(errors: Record<string, string>, name: string) {
  return (
    [
      ...new Set(
        Object.entries(errors)
          .filter(([key]) => key === name || key.startsWith(`${name}.`))
          .map(([, message]) => message),
      ),
    ].join(' ') || undefined
  );
}

export function CrudFormField({
  data,
  editing,
  errors,
  field,
  record,
  onChange,
  onUploadingChange,
}: Props) {
  const { booleanOptions, t, translateOptionLabel } = useCrudI18n();
  const value = data[field.name];
  const error = errorFor(errors, field.name);
  const required = field.required || (!editing && field.requiredOnCreate);
  const stringValue = String(value ?? '');
  let control: ReactNode;

  if (field.type === 'image-url')
    control = (
      <ImageUrlField
        error={error}
        field={field}
        value={stringValue}
        onChange={(next) => onChange(field.name, next)}
      />
    );
  else if (field.type === 'image')
    control = (
      <ImageField
        currentUrl={
          field.preview ? String(record?.values[field.preview] ?? '') : ''
        }
        field={field}
        value={stringValue}
        onChange={(next) => onChange(field.name, next)}
        onUploadingChange={(uploading) =>
          onUploadingChange(field.name, uploading)
        }
      />
    );
  else if (field.type === 'ip-list')
    control = (
      <IpListField
        errors={errors}
        field={field}
        value={Array.isArray(value) ? value : []}
        onChange={(next) => onChange(field.name, next)}
      />
    );
  else if (field.type === 'json')
    control = (
      <JsonField
        error={error}
        field={field}
        value={value}
        onChange={(next) => onChange(field.name, next)}
      />
    );
  else if (field.type === 'textarea')
    control = (
      <TextareaField
        error={error}
        field={field}
        required={required}
        value={stringValue}
        onChange={(next) => onChange(field.name, next)}
      />
    );
  else if (field.type === 'key-value')
    control = (
      <KeyValueField
        field={field}
        provider={String(data.provider ?? '')}
        value={stringValue}
        onChange={(next) => onChange(field.name, next)}
      />
    );
  else if (field.type === 'boolean')
    control = (
      <BooleanField
        field={field}
        label={booleanOptions[value === '1' ? 1 : 0].label}
        value={stringValue}
        onChange={(next) => onChange(field.name, next)}
      />
    );
  else if (field.type === 'select')
    control = (
      <SelectField
        error={error}
        field={field}
        placeholder={
          field.placeholder ??
          t('crud.form.select_placeholder', { field: field.label })
        }
        translate={translateOptionLabel}
        value={stringValue}
        onChange={(next) => {
          onChange(field.name, next);
          if (field.name === 'provider') onChange('credentials', '');
        }}
      />
    );
  else
    control = (
      <TextField
        error={error}
        field={field}
        required={required}
        value={stringValue}
        onChange={(next) => onChange(field.name, next)}
      />
    );

  return (
    <Field data-invalid={Boolean(error)}>
      <FieldLabel htmlFor={`crud-${field.name}`}>
        {field.label}
        {required && <span className="text-destructive">*</span>}
      </FieldLabel>
      {control}
      <FieldError>{error}</FieldError>
    </Field>
  );
}
