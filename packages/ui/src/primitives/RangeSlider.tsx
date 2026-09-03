import { InputHTMLAttributes, forwardRef } from 'react';

import { cn } from '../lib/cn';

export interface RangeSliderProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'> {
    onChange: (value: number) => void;
}

/**
 * Native range input, custom-styled via `accent-color` — same "native
 * input, no JS state" philosophy as Checkbox. Used as the demo viewer's
 * scrub bar; `onChange` is pre-unwrapped to the numeric value since every
 * current caller wants that, not the raw change event.
 */
export const RangeSlider = forwardRef<HTMLInputElement, RangeSliderProps>(({ className, onChange, ...props }, ref) => (
    <input
        ref={ref}
        type="range"
        onChange={(e) => onChange(e.target.valueAsNumber)}
        className={cn(
            'bg-muted accent-accent h-1.5 w-full cursor-pointer appearance-none rounded-full',
            'focus-visible:ring-ring focus-visible:ring-offset-background focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
            'disabled:cursor-not-allowed disabled:opacity-50',
            className,
        )}
        {...props}
    />
));
RangeSlider.displayName = 'RangeSlider';
