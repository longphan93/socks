import type { InputHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';
import { CONTROL_CLASS, Field } from './field';

export interface InputProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'id'
> {
  id: string;
  label: string;
  hint?: string;
  error?: string;
}

export function Input({
  id,
  label,
  hint,
  error,
  className,
  required,
  ...props
}: InputProps) {
  return (
    <Field id={id} label={label} hint={hint} error={error} required={required}>
      <input
        {...props}
        id={id}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={
          error ? `${id}-error` : hint ? `${id}-hint` : undefined
        }
        className={cn(CONTROL_CLASS, 'h-11', className)}
      />
    </Field>
  );
}
