import { ButtonHTMLAttributes, forwardRef } from 'react';

import { cn } from '../lib/cn';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'ghost' | 'destructive';
    size?: 'sm' | 'md' | 'icon';
}

const variantClasses: Record<NonNullable<ButtonProps['variant']>, string> = {
    primary: cn(
        'bg-gradient-to-b from-accent/90 via-accent to-accent/85 text-accent-foreground',
        'shadow-[inset_0_1px_0_rgba(255,255,255,0.3),inset_0_-2px_3px_rgba(0,0,0,0.2)]',
        'hover:brightness-110 active:brightness-95',
    ),
    secondary: 'bg-muted text-foreground hover:bg-border',
    ghost: 'bg-transparent text-foreground hover:bg-muted',
    destructive: cn(
        'bg-gradient-to-b from-destructive/90 via-destructive to-destructive/85 text-destructive-foreground',
        'shadow-[inset_0_1px_0_rgba(255,255,255,0.3),inset_0_-2px_3px_rgba(0,0,0,0.2)]',
        'hover:brightness-110 active:brightness-95',
    ),
};

const sizeClasses: Record<NonNullable<ButtonProps['size']>, string> = {
    sm: 'h-8 px-3 text-sm',
    md: 'h-10 px-4 text-sm',
    icon: 'size-8 p-0',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'primary', size = 'md', disabled, children, ...props }, ref) => (
        <button
            ref={ref}
            disabled={disabled}
            className={cn(
                'inline-flex cursor-pointer items-center justify-center gap-2 rounded-md font-medium transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                'disabled:cursor-not-allowed disabled:opacity-50',
                variantClasses[variant],
                sizeClasses[size],
                className,
            )}
            {...props}
        >
            {children}
        </button>
    ),
);
Button.displayName = 'Button';
