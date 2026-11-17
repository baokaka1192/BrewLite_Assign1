'use client';
import { forwardRef, useId, type InputHTMLAttributes } from 'react';

interface AuthFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const AuthField = forwardRef<HTMLInputElement, AuthFieldProps>(function AuthField(
  { label, error, id: idProp, ...inputProps },
  ref,
) {
  const generatedId = useId();
  const id = idProp ?? generatedId;
  const errorId = `${id}-error`;

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <input
        {...inputProps}
        ref={ref}
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className="h-11 rounded-md border border-border bg-background px-3 text-sm shadow-sm outline-none transition-[border-color,box-shadow] focus:border-primary focus:ring-2 focus:ring-primary aria-[invalid=true]:border-red-600 dark:aria-[invalid=true]:border-red-400 disabled:opacity-60"
      />
      {error && (
        <p id={errorId} role="alert" className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
});
