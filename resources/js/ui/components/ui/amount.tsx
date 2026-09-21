import { cn } from '../../lib/utils';

export type AmountInfo = {
  /**
   * Grouped integer (with locale thousand separators) plus the decimal
   * separator and the fraction with trailing zeros stripped. No sign prefix.
   * Examples: `1,234`, `1,234.5`, `1,234.567890`.
   */
  formatted: string;
  /** Sign of the parsed amount. `0` when the value is exactly zero. */
  sign: -1 | 0 | 1;
};

const decimalFormatParts = new Intl.NumberFormat().formatToParts(1000.1);
const decimalSeparator =
  decimalFormatParts.find((part) => part.type === 'decimal')?.value ?? '.';
const groupSeparator =
  decimalFormatParts.find((part) => part.type === 'group')?.value ?? ',';

const AMOUNT_PATTERN = /^([+-]?)(\d+)(?:\.(\d+))?$/;

/**
 * Format a decimal string into a grouped, trailing-zero-stripped representation
 * without converting to a `number`. Precision is preserved — only trailing
 * zeros in the fraction are removed.
 *
 * Returns `null` when the value is missing, blank, or does not match a decimal
 * string. Callers are responsible for falling back to a raw display.
 */
export function formatAmount(
  value: string | null | undefined,
): AmountInfo | null {
  if (value === null || value === undefined) {
    return null;
  }

  const trimmed = value.trim();

  if (trimmed === '') {
    return null;
  }

  const match = trimmed.match(AMOUNT_PATTERN);

  if (!match) {
    return null;
  }

  const signChar = match[1];
  const integer = (match[2].replace(/^0+(?=\d)/, '') || '0').replace(
    /\B(?=(\d{3})+(?!\d))/g,
    groupSeparator,
  );
  const rawFraction = match[3] ?? '';
  const fraction = rawFraction.replace(/0+$/, '');
  const isZero =
    (match[2] === '' || /^0+$/.test(match[2])) && /^0*$/.test(rawFraction);
  const sign: -1 | 0 | 1 = isZero ? 0 : signChar === '-' ? -1 : 1;

  return {
    formatted: fraction ? `${integer}${decimalSeparator}${fraction}` : integer,
    sign,
  };
}

export type AmountProps = {
  /**
   * Decimal string only. `null`/`undefined`/empty render nothing. The value is
   * never coerced through `Number`, so full precision is preserved.
   */
  value: string | null | undefined;
  /** Prefix `+` for positive and `−` (minus sign) for negative amounts. */
  signed?: boolean;
  /**
   * Marks an internal movement (e.g. funds moving between available and
   * reserved) where the signed amount is zero. Only meaningful with `signed`.
   */
  internalMovement?: boolean;
  /** When `auto`, apply semantic tone classes based on the sign. */
  tone?: 'auto' | 'none';
  className?: string;
};

/**
 * Render a decimal amount with consistent grouping and trailing-zero stripping.
 *
 * Falls back to rendering the raw `value` string when it cannot be parsed as a
 * decimal, so callers don't need to handle that case themselves. When the
 * value is `null`/`undefined`/empty, renders `null`.
 */
export function Amount({
  value,
  signed = false,
  internalMovement = false,
  tone = 'none',
  className,
}: AmountProps) {
  const amount = formatAmount(value);

  if (!amount) {
    if (value === null || value === undefined || value.trim() === '') {
      return null;
    }

    return <span className={className}>{value}</span>;
  }

  const prefix =
    signed && amount.sign > 0 ? '+' : amount.sign < 0 ? '−' : '';
  const toneClassName =
    tone === 'auto' && signed
      ? internalMovement && amount.sign === 0
        ? 'font-medium text-blue-700 dark:text-blue-400'
        : amount.sign > 0
          ? 'font-medium text-emerald-700 dark:text-emerald-400'
          : amount.sign < 0
            ? 'font-medium text-red-700 dark:text-red-400'
            : 'text-muted-foreground'
      : '';

  return (
    <span className={cn('font-mono tabular-nums', toneClassName, className)}>
      {prefix}
      {amount.formatted}
    </span>
  );
}
