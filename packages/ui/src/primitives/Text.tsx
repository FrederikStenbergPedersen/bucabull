import { ElementType, HTMLAttributes } from 'react';

import { cn } from '../lib/cn';

export interface TextProps extends HTMLAttributes<HTMLElement> {
    variant?: 'display' | 'heading' | 'subheading' | 'body' | 'muted';
    as?: ElementType;
}

const variantClasses: Record<NonNullable<TextProps['variant']>, string> = {
    display: 'font-heading text-4xl font-semibold tracking-tight text-foreground sm:text-5xl',
    heading: 'font-heading text-xl font-medium text-foreground',
    subheading: 'font-heading text-lg font-medium text-foreground',
    body: 'text-sm text-foreground',
    muted: 'text-sm text-muted-foreground',
};

const defaultElement: Record<NonNullable<TextProps['variant']>, ElementType> = {
    display: 'h1',
    heading: 'h1',
    subheading: 'h2',
    body: 'p',
    muted: 'p',
};

export function Text({ className, variant = 'body', as, ...props }: TextProps) {
    const Component = as ?? defaultElement[variant];
    return <Component className={cn(variantClasses[variant], className)} {...props} />;
}
