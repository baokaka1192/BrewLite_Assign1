'use client';
import { useState, type FormEvent } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Button } from '@/components/ui/button';
import { AppliedVoucherChip } from './applied-voucher-chip';
import { normalizeVoucherCode } from './payload';

/** Fades and slides a voucher message in when it appears. */
function Message({ id, className, children }: { id?: string; className: string; children: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.p
      id={id}
      role="alert"
      className={className}
      initial={reduce ? false : { opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
    >
      {children}
    </motion.p>
  );
}

interface VoucherFieldProps {
  /** Code currently applied (or locked to a pending order); null when none. */
  appliedCode: string | null;
  /** True while the voucher belongs to a pending order and cannot be changed. */
  locked: boolean;
  fieldError: string | null;
  onApply: (code: string) => void;
  onRemove: () => void;
  /** Called when the user edits the input, so a previous field error can be dismissed. */
  onEdit: () => void;
}

export function VoucherField({ appliedCode, locked, fieldError, onApply, onRemove, onEdit }: VoucherFieldProps) {
  const [input, setInput] = useState('');
  const reduce = useReducedMotion();

  if (locked) {
    return (
      <div className="space-y-2 text-sm">
        <p className="font-medium">Voucher</p>
        <p>
          {appliedCode ? <code>{appliedCode}</code> : 'None'}{' '}
          <span className="text-muted-foreground">(locked to your pending order)</span>
        </p>
        {fieldError && <Message className="text-red-700 dark:text-red-300">{fieldError}</Message>}
      </div>
    );
  }

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const code = normalizeVoucherCode(input);
    if (!code) return;
    onApply(code);
  }

  if (appliedCode) {
    return (
      <motion.div
        className="flex items-center justify-between gap-4 text-sm"
        initial={reduce ? false : { opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
      >
        <AppliedVoucherChip code={appliedCode} />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            setInput('');
            onRemove();
          }}
        >
          Remove
        </Button>
      </motion.div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-2">
      <label htmlFor="voucher-code" className="block text-sm font-medium">
        Voucher code
      </label>
      <div className="flex gap-2">
        <input
          id="voucher-code"
          type="text"
          autoComplete="off"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            if (fieldError) onEdit();
          }}
          aria-invalid={fieldError ? true : undefined}
          aria-describedby={fieldError ? 'voucher-code-error' : undefined}
          className="min-w-0 flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm uppercase shadow-sm outline-none transition-[border-color,box-shadow] focus:border-primary focus:ring-2 focus:ring-primary"
        />
        <Button type="submit" variant="ghost" size="sm" disabled={!normalizeVoucherCode(input)}>
          Apply
        </Button>
      </div>
      {fieldError && (
        <Message id="voucher-code-error" className="text-sm text-red-700 dark:text-red-300">
          {fieldError}
        </Message>
      )}
    </form>
  );
}
