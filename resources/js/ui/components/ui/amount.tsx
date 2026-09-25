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

export type CurrencyDisplay = {
  code: string;
  precision: number;
  symbol?: string | null;
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

export type MoneyProps = AmountProps & {
  currency: CurrencyDisplay;
  /** Display the ISO/code identifier after the amount to disambiguate symbols. */
  showCode?: boolean;
};

function formatMoneyAmount(
  value: string | null | undefined,
  precision: number,
): AmountInfo | null {
  const amount = formatAmount(value);

  if (!amount || precision < 0 || !Number.isInteger(precision)) {
    return amount;
  }

  const trimmed = value?.trim() ?? '';
  const match = trimmed.match(AMOUNT_PATTERN);

  if (!match) {
    return amount;
  }

  const rawFraction = match[3] ?? '';

  // Provider evidence may legitimately contain more precision than our
  // configured currency. Preserve it rather than silently changing the value.
  if (rawFraction.length > precision && /[1-9]/.test(rawFraction.slice(precision))) {
    return amount;
  }

  const fraction = rawFraction.slice(0, precision).padEnd(precision, '0');

  return {
    ...amount,
    formatted: precision === 0
      ? amount.formatted.split(decimalSeparator)[0]
      : `${amount.formatted.split(decimalSeparator)[0]}${decimalSeparator}${fraction}`,
  };
}

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

/**
 * Render a monetary amount using currency-controlled scale without coercing the
 * amount into a JavaScript number. A code suffix keeps ambiguous symbols such
 * as "$" identifiable in multi-currency screens.
 */
export function Money({
  value,
  currency,
  signed = false,
  internalMovement = false,
  tone = 'none',
  className,
  showCode = true,
}: MoneyProps) {
  const amount = formatMoneyAmount(value, currency.precision);

  if (!amount) {
    if (value === null || value === undefined || value.trim() === '') {
      return null;
    }

    return <span className={className}>{value}</span>;
  }

  const prefix = signed && amount.sign > 0 ? '+' : amount.sign < 0 ? '−' : '';
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
  const currencyPrefix = currency.symbol?.trim() || currency.code;

  return (
    <span className={cn('font-mono tabular-nums', toneClassName, className)}>
      {prefix}
      {currencyPrefix}{amount.formatted}
      {showCode && currencyPrefix !== currency.code ? ` ${currency.code}` : ''}
    </span>
  );
}
