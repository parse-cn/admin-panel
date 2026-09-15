import { useHttp } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { FileUpload } from '@admin-panel/ui';
import { useCrudI18n } from '../../../i18n/crud-i18n';
import type { CrudField } from '../types';

type Props = { currentUrl: string; field: CrudField; value: string; onChange: (value: string) => void; onUploadingChange: (uploading: boolean) => void };
type Response = { path: string; url: string };

export function ImageField({ currentUrl, field, value, onChange, onUploadingChange }: Props) {
    const { t } = useCrudI18n(); const [preview, setPreview] = useState<string | null>(null); const upload = useHttp<{ file: File | null }, Response>({ file: null });
    useEffect(() => () => { if (preview?.startsWith('blob:')) URL.revokeObjectURL(preview); }, [preview]);
    const select = (file: File) => { if (!field.uploadUrl) return; setPreview(URL.createObjectURL(file)); onUploadingChange(true); upload.transform(() => ({ file })); void upload.post(field.uploadUrl, { onSuccess: (response) => { setPreview(response.url); onChange(response.path); }, onError: () => setPreview(null), onFinish: () => onUploadingChange(false) }).catch(() => undefined); };
    return <FileUpload accept="image/jpeg,image/png,image/webp" disabled={upload.processing} error={upload.errors.file ? String(upload.errors.file) : undefined} fileName={value ? value.split('/').at(-1) : undefined} maxSizeLabel="2 MB" labels={{ title: t('crud.upload.title'), description: t('crud.upload.description'), requirements: (size) => t('crud.upload.requirements', { size }), select: t('crud.upload.select'), uploaded: t('crud.upload.uploaded'), complete: t('crud.upload.complete'), uploading: (progress) => t('crud.upload.uploading', { progress }), remove: t('crud.upload.remove') }} previewUrl={preview || currentUrl || undefined} progress={upload.processing ? (upload.progress?.percentage ?? 0) : undefined} onFileSelect={select} onClear={value || preview ? () => { setPreview(null); onChange(''); } : undefined} />;
}
