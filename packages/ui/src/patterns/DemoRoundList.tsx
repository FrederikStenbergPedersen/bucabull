import { cn } from '../lib/cn';
import { Text } from '../primitives/Text';

export interface DemoRoundListItem {
    roundNumber: number;
    winner: 'CT' | 'T' | '';
}

export interface DemoRoundListProps {
    rounds: DemoRoundListItem[];
    activeIndex: number;
    onSelect: (index: number) => void;
    className?: string;
}

/**
 * Round picker for the demo viewer's sidebar (TeamLayout's `sidebarExtra`
 * slot, same spot Grenades' map switcher uses). Plain buttons, not
 * SidebarNavItem — picking a round is a client-side playback jump, not a
 * navigation, so it doesn't fit that component's anchor-based contract,
 * even though it borrows the same visual language.
 */
export function DemoRoundList({ rounds, activeIndex, onSelect, className }: DemoRoundListProps) {
    return (
        <div className={cn('border-border flex flex-col gap-1 border-t pt-4', className)}>
            <Text variant="muted" className="px-3 pb-1 text-xs tracking-wide uppercase">
                Rounds
            </Text>
            <div className="flex max-h-80 flex-col gap-1 overflow-y-auto">
                {rounds.map((round, index) => (
                    <button
                        key={round.roundNumber}
                        type="button"
                        onClick={() => onSelect(index)}
                        className={cn(
                            'flex items-center justify-between gap-2.5 rounded-md px-3 py-2 text-left text-sm font-medium transition-colors',
                            index === activeIndex
                                ? 'bg-muted text-foreground ring-accent ring-1'
                                : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
                        )}
                    >
                        <span>Round {round.roundNumber}</span>
                        {round.winner && (
                            <span
                                className={cn('size-2 shrink-0 rounded-full', round.winner === 'CT' ? 'bg-team-ct' : 'bg-team-t')}
                                aria-label={`${round.winner} won`}
                            />
                        )}
                    </button>
                ))}
            </div>
        </div>
    );
}
