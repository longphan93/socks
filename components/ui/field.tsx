import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface FieldProps {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  className?: string;
  children: ReactNode;
}

/** Bọc label, hint và thông báo lỗi quanh một input bất kỳ. */
export function Field({
  id,
  label,
  hint,
  error,
  required,
  className,
  children,
}: FieldProps) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={id} className="text-sm font-medium text-ink">
        {label}
        {required && (
          <span className="text-danger" aria-hidden="true">
            {' *'}
          </span>
        )}
      </label>

      {children}

      {error ? (
        <p id={`${id}-error`} role="alert" className="text-sm text-danger">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-sm text-ink-subtle">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export const CONTROL_CLASS = cn(
  'w-full rounded-xl border border-border bg-surface px-3.5 text-ink',
  'placeholder:text-ink-subtle',
  'transition-colors hover:border-border-strong',
  'disabled:cursor-not-allowed disabled:bg-surface-sunken disabled:text-ink-subtle',
  'aria-[invalid=true]:border-danger',
);
