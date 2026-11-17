import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-[color,background-color,border-color,box-shadow,transform] duration-200 ease-out hover:-translate-y-px active:translate-y-0 active:scale-[0.97] motion-reduce:transform-none motion-reduce:active:scale-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        solid: 'bg-primary text-primary-foreground shadow-[0_4px_14px_-6px_hsl(var(--shadow-btn))] hover:bg-primary/90 hover:shadow-[0_8px_20px_-8px_hsl(var(--shadow-btn-hover))]',
        outline: 'border border-primary text-primary hover:bg-primary hover:text-primary-foreground hover:shadow-[0_6px_16px_-8px_hsl(var(--shadow-btn-outline-hover))]',
        ghost: 'border border-border text-foreground hover:border-primary hover:bg-surface',
        cream: 'bg-background text-primary shadow-sm hover:bg-surface hover:shadow-md',
      },
      size: { default: 'h-11 px-6', sm: 'h-9 px-4' },
    },
    defaultVariants: { variant: 'solid', size: 'default' },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return <Comp ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />;
  },
);
Button.displayName = 'Button';
