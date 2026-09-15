import { Input } from '@admin-panel/ui';
import type { CrudField } from '../types';

export function ImageUrlField({ error, field, value, onChange }: { error?: string; field: CrudField; value: string; onChange: (value: string) => void }) {
    return <div className="flex flex-col gap-3">{value && <div className="flex h-32 items-center justify-center overflow-hidden rounded-lg border bg-muted/30 p-4"><img alt="" className="h-full w-full object-contain" src={value} /></div>}<Input aria-invalid={Boolean(error)} id={`crud-${field.name}`} onChange={(event) => onChange(event.target.value)} placeholder={field.placeholder} type="text" value={value} /></div>;
}
