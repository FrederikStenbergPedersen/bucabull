import { HTMLAttributes } from 'react';

import { cn } from '../lib/cn';

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cn(
                'rounded-lg border border-border bg-card p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]',
                className,
            )}
            {...props}
        />
    );
}
