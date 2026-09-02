import type { ComponentPropsWithoutRef } from 'react';
import { cn } from '../../lib/utils';

type RemixIconProps = Omit<ComponentPropsWithoutRef<'i'>, 'children'> & {
    name: string;
};

export function RemixIcon({
    name,
    className,
    ...props
}: RemixIconProps) {
    const normalizedName = name.startsWith('ri-') ? name.slice(3) : name;
    const iconClassName = /^[a-z0-9-]+$/.test(normalizedName)
        ? `ri-${normalizedName}`
        : 'ri-question-line';

    return (
        <i
            aria-hidden="true"
            className={cn(
                iconClassName,
                'inline-block text-base leading-none',
                className,
            )}
            {...props}
        />
    );
}
