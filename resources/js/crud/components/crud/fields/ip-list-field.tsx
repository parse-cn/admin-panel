import { XIcon } from 'lucide-react';
import type { KeyboardEvent } from 'react';
import { useState } from 'react';
import { Badge, Input } from '@admin-panel/ui';
import type { CrudField } from '../types';

type Props = {
  errors: Record<string, string>;
  field: CrudField;
  value: string[];
  onChange: (value: string[]) => void;
};

export function IpListField({ errors, field, value, onChange }: Props) {
  const [input, setInput] = useState('');
  const add = (raw: string) => {
    const next = raw
      .split(/[\n,]+/)
      .map((item) => item.trim())
      .filter(Boolean);
    if (next.length) onChange([...value, ...next]);
    setInput('');
  };
  const error = Object.keys(errors).some(
    (key) => key === field.name || key.startsWith(`${field.name}.`),
  );
  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      add(input);
    } else if (event.key === 'Backspace' && !input)
      onChange(value.slice(0, -1));
  };
  return (
    <div className="rounded-lg border px-2" data-invalid={error}>
      <div className="flex flex-wrap gap-2">
        {value.map((ip, index) => {
          const itemError = errors[`${field.name}.${index}`];
          return (
            <Badge
              className={
                itemError ? 'border-destructive text-destructive' : undefined
              }
              key={`${ip}-${index}`}
              variant="secondary"
            >
              {ip}
              <button
                aria-label={`Remove ${ip}`}
                className="ml-1 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onClick={() =>
                  onChange(value.filter((_, itemIndex) => itemIndex !== index))
                }
                type="button"
              >
                <XIcon className="size-3" />
              </button>
              {itemError && (
                <span className="ml-1 text-xs text-destructive">
                  {itemError}
                </span>
              )}
            </Badge>
          );
        })}
        <Input
          aria-invalid={error}
          className="h-7 min-w-40 flex-1 border-0 bg-transparent px-1 py-0 shadow-none focus-visible:ring-0"
          id={`crud-${field.name}`}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={onKeyDown}
          onPaste={(event) => {
            const pasted = event.clipboardData.getData('text');
            if (/[\n,]/.test(pasted)) {
              event.preventDefault();
              add(pasted);
            }
          }}
          placeholder={field.placeholder ?? 'Enter an IP address'}
          value={input}
        />
      </div>
    </div>
  );
}
