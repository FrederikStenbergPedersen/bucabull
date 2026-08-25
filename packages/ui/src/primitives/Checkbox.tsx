import { InputHTMLAttributes, forwardRef } from 'react';

import { cn } from '../lib/cn';

/** Native checkbox, custom-styled via `accent-color` — no Radix, no JS state to manage. */
export const Checkbox = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(({ className, ...props }, ref) => (
    <input
        ref={ref}
        type="checkbox"
        className={cn(
            'size-5 rounded-sm border border-input accent-accent',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
            'disabled:cursor-not-allowed disabled:opacity-50',
            className,
        )}
        {...props}
    />
));
Checkbox.displayName = 'Checkbox';
