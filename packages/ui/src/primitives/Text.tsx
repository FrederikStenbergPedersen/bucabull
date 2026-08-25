import { ElementType, HTMLAttributes } from 'react';

import { cn } from '../lib/cn';

export interface TextProps extends HTMLAttributes<HTMLElement> {
    variant?: 'heading' | 'subheading' | 'body' | 'muted';
    as?: ElementType;
}

const variantClasses: Record<NonNullable<TextProps['variant']>, string> = {
    heading: 'font-heading text-xl font-medium text-foreground',
    subheading: 'font-heading text-lg font-medium text-foreground',
    body: 'text-sm text-foreground',
    muted: 'text-sm text-muted-foreground',
};

const defaultElement: Record<NonNullable<TextProps['variant']>, ElementType> = {
    heading: 'h1',
    subheading: 'h2',
    body: 'p',
    muted: 'p',
};

export function Text({ className, variant = 'body', as, ...props }: TextProps) {
    const Component = as ?? defaultElement[variant];
    return <Component className={cn(variantClasses[variant], className)} {...props} />;
}
