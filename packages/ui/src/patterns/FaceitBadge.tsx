import { cn } from '../lib/cn';

/**
 * Matches FACEIT's own skill-level color bands (grey/yellow/orange/red),
 * not our brand palette — players already read these colors as meaning
 * something specific, so borrowing them beats inventing our own.
 */
const LEVEL_COLORS: Record<number, string> = {
    1: '#9aa0a8',
    2: '#9aa0a8',
    3: '#9aa0a8',
    4: '#ffc115',
    5: '#ffc115',
    6: '#ffc115',
    7: '#ff8a00',
    8: '#ff8a00',
    9: '#fd4556',
    10: '#fd4556',
};

export interface FaceitBadgeProps {
    level: number;
    elo: number;
    className?: string;
}

export function FaceitBadge({ level, elo, className }: FaceitBadgeProps) {
    const color = LEVEL_COLORS[level] ?? LEVEL_COLORS[1];

    return (
        <span
            className={cn('inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium', className)}
            style={{ background: `linear-gradient(to bottom, ${color}33, ${color}18)`, color }}
        >
            <span
                className="size-1.5 rounded-full shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),inset_0_-1px_1px_rgba(0,0,0,0.35)]"
                style={{ backgroundColor: color }}
            />
            Faceit {level} · {elo}
        </span>
    );
}
