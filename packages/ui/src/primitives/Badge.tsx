import { HTMLAttributes } from 'react';

import { cn } from '../lib/cn';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
    tone?: 'positive' | 'neutral' | 'muted';
}

const toneClasses: Record<NonNullable<BadgeProps['tone']>, string> = {
    positive: 'bg-accent/15 text-accent',
    neutral: 'bg-muted text-foreground',
    muted: 'bg-transparent text-muted-foreground border border-border',
};

const dotClasses: Record<NonNullable<BadgeProps['tone']>, string> = {
    positive: 'bg-accent',
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
