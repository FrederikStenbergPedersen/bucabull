import { ReactNode, useId } from 'react';

import { cn } from '../lib/cn';

export interface SegmentedControlOption<T extends string> {
    value: T;
    label: string;
    icon?: ReactNode;
}

export interface SegmentedControlProps<T extends string> {
    name?: string;
    options: SegmentedControlOption<T>[];
    value: T;
    onChange: (value: T) => void;
    size?: 'sm' | 'md';
    className?: string;
}

/**
 * Native radio inputs wrapped in labels (styled via the `has-checked:`
 * variant) rather than manually-managed onClick state — keeps free
 * keyboard/screen-reader semantics, same "native input, no JS state"
 * philosophy as Checkbox.
 *
 * Each option is its own independently-sized pill rather than sharing one
 * bordered container box — a shared box reads as a uniform "blocky"
 * rectangle when different fields have different option counts side by
 * side; individual pills don't have that problem, they just wrap.
 */
export function SegmentedControl<T extends string>({ name, options, value, onChange, size = 'sm', className }: SegmentedControlProps<T>) {
    const generatedName = useId();
    const groupName = name ?? generatedName;

    return (
        <div className={cn('flex flex-wrap gap-1.5', className)}>
            {options.map((option) => (
                <label
                    key={option.value}
                    className={cn(
                        'flex cursor-pointer items-center gap-1.5 rounded-full border border-border font-medium text-muted-foreground transition-colors',
                        'hover:border-accent/50 hover:text-foreground',
                        'has-checked:border-accent has-checked:bg-accent/10 has-checked:text-foreground',
                        'has-focus-visible:outline-none has-focus-visible:ring-2 has-focus-visible:ring-ring has-focus-visible:ring-offset-2 has-focus-visible:ring-offset-background',
                        size === 'sm' ? 'px-3 py-1.5 text-xs' : 'flex-col gap-1 px-4 py-2.5 text-sm',
                    )}
                >
                    <input
                        type="radio"
                        name={groupName}
                        value={option.value}
                        checked={value === option.value}
                        onChange={() => onChange(option.value)}
                        className="sr-only"
                    />
                    {option.icon}
                    {option.label}
                </label>
            ))}
        </div>
    );
}
