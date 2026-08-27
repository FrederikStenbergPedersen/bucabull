import { HTMLAttributes } from 'react';

import { cn } from '../lib/cn';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
    tone?: 'positive' | 'negative' | 'info' | 'neutral' | 'muted';
}

const toneClasses: Record<NonNullable<BadgeProps['tone']>, string> = {
    positive: 'bg-positive/15 text-positive',
    negative: 'bg-destructive/15 text-destructive',
    info: 'bg-accent-secondary/15 text-accent-secondary',
    neutral: 'bg-muted text-foreground',
    muted: 'bg-transparent text-muted-foreground border border-border',
};

const dotClasses: Record<NonNullable<BadgeProps['tone']>, string> = {
    positive: 'bg-positive animate-pulse-soft',
    negative: 'bg-destructive',
    info: 'bg-accent-secondary',
    neutral: 'bg-foreground',
    muted: 'bg-muted-foreground',
};

export function Badge({ className, tone = 'neutral', children, ...props }: BadgeProps) {
    return (
        <span
            className={cn('inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium', toneClasses[tone], className)}
            {...props}
        >
            <span className={cn('size-1.5 rounded-full', dotClasses[tone])} />
            {children}
        </span>
    );
}
