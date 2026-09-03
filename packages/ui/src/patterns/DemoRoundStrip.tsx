import { cn } from '../lib/cn';
import { Text } from '../primitives/Text';

export interface DemoRoundStripRound {
    roundNumber: number;
    winner: 'CT' | 'T' | '';
    /** The pre-match knife round — rendered as "K" instead of "R{roundNumber}", and excluded from the score. */
    isKnifeRound?: boolean;
    /**
     * Cumulative rounds won as of (and including) this round, by whichever
     * real team is currently playing that side — not a running "CT wins"
     * tally, since sides swap at halftime. See show.tsx's derivation.
     */
    ctScore: number;
    tScore: number;
}

export interface DemoRoundStripProps {
    rounds: DemoRoundStripRound[];
    activeIndex: number;
    onSelect: (index: number) => void;
    className?: string;
}

/**
 * Horizontal round-by-round strip below the radar, replacing DemoRoundList
 * for the pages that use it — a full match can have 20-30+ rounds, so this
 * scrolls horizontally rather than trying to fit them all. Same active/dot
 * visual language as DemoRoundList, just laid out as a row of compact tabs
 * instead of a vertical sidebar list.
 */
export function DemoRoundStrip({ rounds, activeIndex, onSelect, className }: DemoRoundStripProps) {
    return (
        <div className={cn('flex gap-1.5 overflow-x-auto pb-1', className)}>
            {rounds.map((round, index) => (
                <button
                    key={round.roundNumber}
                    type="button"
                    onClick={() => onSelect(index)}
                    className={cn(
                        'flex shrink-0 flex-col items-center gap-1 rounded-md px-2.5 py-1.5 text-center transition-colors',
                        index === activeIndex
                            ? 'bg-muted text-foreground ring-accent ring-1'
                            : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
                    )}
                >
                    <span className="flex items-center gap-1 text-xs font-medium">
                        {round.isKnifeRound ? 'K' : `R${round.roundNumber}`}
                        {round.winner && (
                            <span
                                className={cn('size-1.5 rounded-full', round.winner === 'CT' ? 'bg-team-ct' : 'bg-team-t')}
                                aria-label={`${round.winner} won`}
                            />
                        )}
                    </span>
                    <Text variant="muted" className="text-[10px] tabular-nums">
                        {round.ctScore}-{round.tScore}
                    </Text>
                </button>
            ))}
        </div>
    );
}
