import type { ComponentProps } from 'react';
import { Input } from '../ui/components/ui/input';
import { cn } from '../ui/lib/utils';

export function TwoFactorCodeInput({
  recovery = false,
  className,
  ...props
}: ComponentProps<typeof Input> & { recovery?: boolean }) {
  return (
    <Input
      type="text"
      inputMode={recovery ? 'text' : 'numeric'}
      autoComplete="one-time-code"
      maxLength={recovery ? 20 : 6}
      placeholder={recovery ? undefined : '000000'}
      required
      className={cn(
        'h-12 font-mono',
        !recovery && 'text-center text-xl tracking-[0.4em] md:text-xl',
        className,
      )}
      {...props}
    />
  );
}
