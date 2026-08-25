import { HTMLAttributes } from 'react';

import { cn } from '../lib/cn';

export function FieldError({ message, className, ...props }: HTMLAttributes<HTMLParagraphElement> & { message?: string }) {
    if (!message) return null;
    return (
        <p className={cn('text-sm text-destructive', className)} {...props}>
            {message}
        </p>
    );
}
