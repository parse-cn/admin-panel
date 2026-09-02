import { cn } from '../../lib/utils';
import type { AppShellBrand as AppShellBrandProps } from './types';

export function AppShellBrand({
    brand,
    className,
    fallbackClassName,
    logoClassName,
    nameClassName,
}: {
    brand: AppShellBrandProps;
    className?: string;
    fallbackClassName?: string;
    logoClassName?: string;
    nameClassName?: string;
}) {
    return (
        <div
            className={cn('inline-flex min-w-0 items-center gap-2', className)}
        >
            {brand.logo ? (
                <img
                    alt=""
                    className={cn(
                        'size-7 shrink-0 rounded-md object-contain',
                        logoClassName,
                    )}
                    src={brand.logo}
                />
            ) : (
                <div
                    className={cn(
                        'flex size-7 shrink-0 items-center justify-center bg-primary text-xs font-semibold text-primary-foreground',
                        fallbackClassName,
                    )}
                >
                    {brand.name.slice(0, 1).toUpperCase()}
                </div>
            )}
            <span className={cn('truncate text-sm font-bold', nameClassName)}>
                {brand.name}
            </span>
        </div>
    );
}
