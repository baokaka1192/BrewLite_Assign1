'use client';
import { motion, useReducedMotion } from 'motion/react';
import { cn } from '@/lib/utils';

/** Amber underline that draws in left-to-right once on view. Reduced motion: shown fully drawn. */
export function AmberRule({ className }: { className?: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.span
      aria-hidden
      className={cn('mt-3 block h-[3px] w-16 origin-left bg-accent', className)}
      initial={{ scaleX: reduce ? 1 : 0 }}
      whileInView={{ scaleX: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    />
  );
}
