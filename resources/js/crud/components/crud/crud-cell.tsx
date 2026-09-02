import { useState } from 'react';
import { Link } from '@inertiajs/react';
import { ArrowRightIcon, CheckIcon, CopyIcon, MinusIcon } from 'lucide-react';
import { Avatar, AvatarImage, Badge } from '@admin-panel/ui';
import { useCrudI18n } from '../../i18n/crud-i18n';
import type { CrudColumn, CrudRecord } from './types';

type CrudCellProps = {
    column: CrudColumn;
    href?: string;
    onShow?: () => void;
    record?: CrudRecord;
    value: unknown;
};

const badgeVariants = {
    default: 'outline',
    success: 'success-outline',
    warning: 'warning-outline',
    destructive: 'destructive-outline',
} as const;

const dateTimeFormatter = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    timeZone: 'UTC',
});

const detailLinkClassName =
    'group/detail-link inline-flex w-fit max-w-full cursor-pointer items-center gap-1 font-medium text-foreground no-underline outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none';

const detailLinkTextClassName =
    'relative truncate after:absolute after:right-0 after:bottom-0 after:left-0 after:h-px after:origin-left after:scale-x-0 after:bg-foreground after:opacity-0 after:transition-[transform,opacity] after:duration-280 after:ease-out group-hover/detail-link:after:scale-x-100 group-hover/detail-link:after:opacity-100 group-focus-visible/detail-link:after:scale-x-100 group-focus-visible/detail-link:after:opacity-100 motion-reduce:after:transition-none';

const decimalFormatParts = new Intl.NumberFormat().formatToParts(1000.1);
const decimalSeparator =
    decimalFormatParts.find((part) => part.type === 'decimal')?.value ?? '.';
const groupSeparator =
    decimalFormatParts.find((part) => part.type === 'group')?.value ?? ',';

function formatDecimal(value: unknown): {
    formatted: string;
    sign: -1 | 0 | 1;
} | null {
    const match = String(value)
        .trim()
        .match(/^([+-]?)(\d+)(?:\.(\d+))?$/);

    if (!match) {
        return null;
    }

    const integer = (match[2].replace(/^0+(?=\d)/, '') || '0').replace(
        /\B(?=(\d{3})+(?!\d))/g,
        groupSeparator,
    );
    const rawFraction = match[3] ?? '';
    const fraction = rawFraction.replace(/0+$/, '').slice(0, 8).padEnd(2, '0');
    const isZero = /^0+$/.test(match[2]) && /^0*$/.test(rawFraction);
    const sign = isZero ? 0 : match[1] === '-' ? -1 : 1;

    return {
        formatted: `${integer}${decimalSeparator}${fraction}`,
        sign,
    };
}

export function CrudCell({
    column,
    href,
    onShow,
    record,
    value,
}: CrudCellProps) {
    const { booleanOptions, translateOptionLabel } = useCrudI18n();
    const [copied, setCopied] = useState(false);

    if (value === null || value === undefined || value === '') {
        return <span className="text-muted-foreground">—</span>;
    }

    if (column.copyable) {
        const text = String(value);
        const displayText =
            column.truncateMiddle && text.length > 14
                ? `${text.slice(0, 7)}…${text.slice(-7)}`
                : text;

        return (
            <button
                type="button"
                className="inline-flex max-w-full items-center gap-1.5 text-left font-mono text-xs text-muted-foreground hover:text-foreground"
                title={text}
                onClick={() => {
                    void navigator.clipboard?.writeText(text).then(() => {
                        setCopied(true);
                        window.setTimeout(() => setCopied(false), 1200);
                    });
                }}
            >
                <span className={column.truncate ? 'max-w-44 truncate' : ''}>
                    {displayText}
                </span>
                {copied ? (
                    <CheckIcon
                        aria-hidden="true"
                        className="size-3.5 shrink-0"
                    />
                ) : (
                    <CopyIcon
                        aria-hidden="true"
                        className="size-3.5 shrink-0"
                    />
                )}
            </button>
        );
    }

    if (column.type === 'boolean') {
        const isTrue = value === true || value === 1 || value === '1';
        const option = booleanOptions[isTrue ? 1 : 0];

        return (
            <span
                className={
                    isTrue
                        ? 'inline-flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400'
                        : 'inline-flex items-center gap-1.5 text-muted-foreground'
                }
            >
                {isTrue ? (
                    <CheckIcon aria-hidden="true" className="size-4" />
                ) : (
                    <MinusIcon aria-hidden="true" className="size-4" />
                )}
                <span>{option.label}</span>
            </span>
        );
    }

    if (column.type === 'badge') {
        const option =
            column.options?.[String(value)] ??
            (typeof value === 'boolean'
                ? column.options?.[value ? '1' : '0']
                : undefined);
        const variant = option?.variant ?? 'default';

        return (
            <Badge variant={badgeVariants[variant]}>
                {option ? translateOptionLabel(option.label) : String(value)}
            </Badge>
        );
    }

    if (column.type === 'identity' && record) {
        const title = String(value);
        const subtitle = column.subtitle
            ? record.values[column.subtitle]
            : null;
        const avatar = column.avatar ? record.values[column.avatar] : null;
        const hasAvatar = avatar !== null && avatar !== undefined && avatar !== '';
        const identityTitleClassName = column.truncate
            ? `${detailLinkTextClassName} max-w-64`
            : detailLinkTextClassName;
        const identityValueClassName = column.truncate
            ? 'block max-w-64 truncate font-medium text-foreground'
            : 'truncate font-medium text-foreground';
        const identitySubtitleClassName = column.truncate
            ? 'block max-w-64 truncate text-sm font-normal text-muted-foreground'
            : 'truncate text-sm font-normal text-muted-foreground';

        return (
            <div className="flex min-w-0 items-center gap-3 py-1">
                {hasAvatar && (
                    <Avatar className="size-9">
                        <AvatarImage src={String(avatar)} alt="" />
                    </Avatar>
                )}
                <div className="min-w-0">
                    {href ? (
                        <Link href={href} className={detailLinkClassName}>
                            <span className={identityTitleClassName}>
                                {title}
                            </span>
                            <ArrowRightIcon
                                aria-hidden="true"
                                className="size-3 shrink-0 -translate-x-1 scale-75 self-center opacity-0 transition-[transform,opacity] duration-180 ease-out group-hover/detail-link:translate-x-0 group-hover/detail-link:scale-100 group-hover/detail-link:opacity-100 group-focus-visible/detail-link:translate-x-0 group-focus-visible/detail-link:scale-100 group-focus-visible/detail-link:opacity-100 motion-reduce:transition-none"
                            />
                        </Link>
                    ) : onShow ? (
                        <button
                            type="button"
                            className={`appearance-none border-0 bg-transparent p-0 text-left ${detailLinkClassName}`}
                            onClick={onShow}
                        >
                            <span className={identityTitleClassName}>
                                {title}
                            </span>
                            <ArrowRightIcon
                                aria-hidden="true"
                                className="size-3 shrink-0 -translate-x-1 scale-75 self-center opacity-0 transition-[transform,opacity] duration-180 ease-out group-hover/detail-link:translate-x-0 group-hover/detail-link:scale-100 group-hover/detail-link:opacity-100 group-focus-visible/detail-link:translate-x-0 group-focus-visible/detail-link:scale-100 group-focus-visible/detail-link:opacity-100 motion-reduce:transition-none"
                            />
                        </button>
                    ) : (
                        <div
                            className={identityValueClassName}
                            title={column.truncate ? title : undefined}
                        >
                            {title}
                        </div>
                    )}
                    {subtitle !== null &&
                        subtitle !== undefined &&
                        subtitle !== '' && (
                            <div
                                className={identitySubtitleClassName}
                                title={column.truncate ? String(subtitle) : undefined}
                            >
                                {String(subtitle)}
                            </div>
                        )}
                </div>
            </div>
        );
    }

    if (column.type === 'datetime') {
        const date = new Date(String(value));

        return (
            <span>
                {Number.isNaN(date.getTime())
                    ? String(value)
                    : dateTimeFormatter.format(date)}
            </span>
        );
    }

    if (column.type === 'decimal' || column.type === 'signed-decimal') {
        const amount = formatDecimal(value);

        if (!amount) {
            return <span>{String(value)}</span>;
        }

        const signed = column.type === 'signed-decimal';
        const referenceAmount = column.signedColorReference
            ? formatDecimal(record?.values[column.signedColorReference])
            : null;
        const isInternalMovement = signed && referenceAmount?.sign === 0;
        const className = isInternalMovement
            ? 'font-medium text-blue-700 dark:text-blue-400'
            : signed
              ? amount.sign > 0
                  ? 'font-medium text-emerald-700 dark:text-emerald-400'
                  : amount.sign < 0
                    ? 'font-medium text-red-700 dark:text-red-400'
                    : 'text-muted-foreground'
              : 'text-foreground';

        return (
            <span className={`font-mono tabular-nums ${className}`}>
                {signed && amount.sign > 0 ? '+' : amount.sign < 0 ? '−' : ''}
                {amount.formatted}
            </span>
        );
    }

    if (column.type === 'json') {
        return (
            <pre
                className="max-h-96 overflow-auto rounded-lg bg-muted/60 p-4 font-mono text-xs leading-relaxed whitespace-pre text-foreground"
                tabIndex={0}
            >
                {JSON.stringify(value, null, 2)}
            </pre>
        );
    }

    const text = String(value);
    const displayText =
        column.truncateMiddle && text.length > 14
            ? `${text.slice(0, 7)}…${text.slice(-7)}`
            : text;

    return (
        <span
            className={column.truncate ? 'block max-w-64 truncate' : undefined}
            title={column.truncate ? text : undefined}
        >
            {displayText}
        </span>
    );
}
