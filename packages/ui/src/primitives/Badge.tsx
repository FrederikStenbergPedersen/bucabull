import { HTMLAttributes } from 'react';

import { cn } from '../lib/cn';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
    tone?: 'positive' | 'negative' | 'info' | 'warning' | 'neutral' | 'muted';
}

const toneClasses: Record<NonNullable<BadgeProps['tone']>, string> = {
    positive: 'bg-gradient-to-b from-positive/20 to-positive/10 text-positive',
    negative: 'bg-gradient-to-b from-destructive/20 to-destructive/10 text-destructive',
    info: 'bg-gradient-to-b from-accent-secondary/20 to-accent-secondary/10 text-accent-secondary',
    warning: 'bg-gradient-to-b from-warning/20 to-warning/10 text-warning',
    neutral: 'bg-muted text-foreground',
    muted: 'bg-transparent text-muted-foreground border border-border',
};

const dotClasses: Record<NonNullable<BadgeProps['tone']>, string> = {
    positive: 'bg-positive animate-pulse-soft',
    negative: 'bg-destructive',
    info: 'bg-accent-secondary',
    warning: 'bg-warning',
    neutral: 'bg-foreground',
    muted: 'bg-muted-foreground',
};

export function Badge({ className, tone = 'neutral', children, ...props }: BadgeProps) {
    return (
        <span
            className={cn('inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium', toneClasses[tone], className)}
            {...props}
        >
            <span
                className={cn(
                    'size-1.5 rounded-full shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),inset_0_-1px_1px_rgba(0,0,0,0.35)]',
                    dotClasses[tone],
                )}
            />
            {children}
        </span>
    );
}
