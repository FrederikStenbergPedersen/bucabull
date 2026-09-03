import { ReactNode } from 'react';

import { cn } from '../lib/cn';

export interface MultiSegmentedControlOption<T extends string> {
    value: T;
    label: string;
    icon?: ReactNode;
}

export interface MultiSegmentedControlProps<T extends string> {
    name?: string;
    options: MultiSegmentedControlOption<T>[];
    value: T[];
    onChange: (value: T[]) => void;
    size?: 'sm' | 'md';
    className?: string;
}

/**
 * SegmentedControl's multi-select sibling — same pill visual language
 * (`has-checked:` styling on a native input wrapped in a label), backed by
 * checkboxes instead of radios so more than one option can be active at
 * once (e.g. a strategy can be tagged both Buyround and Force).
 */
export function MultiSegmentedControl<T extends string>({ name, options, value, onChange, size = 'sm', className }: MultiSegmentedControlProps<T>) {
    function toggle(option: T) {
        onChange(value.includes(option) ? value.filter((v) => v !== option) : [...value, option]);
    }

    return (
        <div className={cn('flex flex-wrap gap-1.5', className)}>
            {options.map((option) => (
                <label
                    key={option.value}
                    className={cn(
                        'border-border text-muted-foreground flex cursor-pointer items-center gap-1.5 rounded-full border font-medium transition-colors',
                        'hover:border-accent/50 hover:text-foreground',
                        'has-checked:border-accent has-checked:bg-accent/10 has-checked:text-foreground',
                        'has-focus-visible:ring-ring has-focus-visible:ring-offset-background has-focus-visible:ring-2 has-focus-visible:ring-offset-2 has-focus-visible:outline-none',
                        size === 'sm' ? 'px-3 py-1.5 text-xs' : 'flex-col gap-1 px-4 py-2.5 text-sm',
                    )}
                >
                    <input
                        type="checkbox"
                        name={name}
                        value={option.value}
                        checked={value.includes(option.value)}
                        onChange={() => toggle(option.value)}
                        className="sr-only"
                    />
                    {option.icon}
                    {option.label}
                </label>
            ))}
        </div>
    );
}
