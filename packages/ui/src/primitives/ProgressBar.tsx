import { cn } from '../lib/cn';

export interface ProgressBarProps {
    /** 0-100. */
    value: number;
    className?: string;
}

/** Plain determinate progress bar — no indeterminate state, since every current use (demo upload) always has a real percentage to show. */
export function ProgressBar({ value, className }: ProgressBarProps) {
    const clamped = Math.min(100, Math.max(0, value));

    return (
        <div
            className={cn('bg-muted h-2 w-full overflow-hidden rounded-full', className)}
            role="progressbar"
            aria-valuenow={clamped}
            aria-valuemin={0}
            aria-valuemax={100}
        >
            <div className="bg-accent h-full rounded-full transition-[width] duration-150 ease-out" style={{ width: `${clamped}%` }} />
        </div>
    );
}
