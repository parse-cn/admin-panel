import type { ReactNode } from 'react';
import { Badge } from './badge';

export function PageHeader({
    title,
    count,
    description,
    actions,
}: {
    title: string;
    count?: string;
    description?: string;
    actions?: ReactNode;
}) {
    return (
        <header className="flex flex-col gap-3 sm:min-h-8 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
                <div className="flex items-center gap-2">
                    <h1 className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">
                        {title}
                    </h1>
                    {count && (
                        <Badge variant="secondary" className="tabular-nums">
                            {count}
                        </Badge>
                    )}
                </div>
                {description && (
                    <p className="mt-0.5 text-sm text-muted-foreground">
                        {description}
                    </p>
                )}
            </div>
            {actions && (
                <div className="flex shrink-0 items-center gap-2">
                    {actions}
                </div>
            )}
        </header>
    );
}
