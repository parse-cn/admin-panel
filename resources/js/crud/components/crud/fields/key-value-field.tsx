import { Input, Textarea } from '@admin-panel/ui';
import type { CrudCredentialOption, CrudField } from '../types';

type Props = {
  field: CrudField;
  provider: string;
  value: string;
  onChange: (value: string) => void;
};

function parse(value: string): Record<string, string> {
  try {
    const item: unknown = JSON.parse(value);
    return item && typeof item === 'object' && !Array.isArray(item)
      ? Object.fromEntries(
          Object.entries(item).map(([key, value]) => [
            key,
            String(value ?? ''),
          ]),
        )
      : {};
  } catch {
    return {};
  }
}

export function KeyValueField({ field, provider, value, onChange }: Props) {
  const definitions: CrudCredentialOption[] =
    field.credentialOptions?.[provider] ?? [];
  const values = parse(value);
  const setValue = (key: string, next: string) =>
    onChange(
      JSON.stringify(
        Object.fromEntries(
          Object.entries({ ...values, [key]: next }).filter(([name]) =>
            definitions.some((definition) => definition.key === name),
          ),
        ),
      ),
    );
  if (!provider)
    return (
      <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
        Select a provider to configure credentials.
      </div>
    );
  if (!definitions.length)
    return (
      <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
        This provider does not require credentials.
      </div>
    );
  return (
    <div className="flex flex-col gap-4 rounded-lg border p-4">
      {definitions.map((definition) => {
        const multiline =
          definition.key.includes('private') ||
          definition.key.includes('public');
        return (
          <div
            className="grid gap-2 md:grid-cols-[minmax(10rem,0.4fr)_minmax(0,1fr)] md:items-start"
            key={definition.key}
          >
            <div className="flex flex-col gap-1 pt-2">
              <span className="font-mono text-sm">{definition.key}</span>
              {definition.optional && (
                <span className="text-xs text-muted-foreground">Optional</span>
              )}
            </div>
            {multiline ? (
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
