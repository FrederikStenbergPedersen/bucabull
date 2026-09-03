import { Skull } from 'lucide-react';

import { cn } from '../lib/cn';
import { Badge } from '../primitives/Badge';
import { Text } from '../primitives/Text';

export interface DemoKillFeedEntry {
    time_s: number;
    killer_steam_id: string | null;
    victim_steam_id: string | null;
    weapon: string;
    headshot: boolean;
}

export interface DemoKillFeedProps {
    /** The current round's full kill list, in any order — filtered/sorted internally. */
    kills: DemoKillFeedEntry[];
    /** Only kills at or before this point in the round are shown — driven by playback time, not tick, since KillEvent already carries time_s. */
    currentTimeS: number;
    /** steam_id -> display name, built from the round's own frame data (kills only carry IDs) — see DemoShow's playerNames. */
    playerNames: Record<string, string>;
    maxVisible?: number;
    className?: string;
}

function nameFor(steamId: string | null, playerNames: Record<string, string>): string {
    if (steamId === null) return 'World';
    return playerNames[steamId] ?? 'Unknown';
}

/**
 * A reactive (non-canvas) component, unlike DemoRadar — kills happen a
 * handful of times a round, not 60 times a second, so a normal
 * re-render driven by useDemoPlayback's throttled `timeS` is the right
 * cost/simplicity tradeoff here, no imperative draw() needed.
 */
export function DemoKillFeed({ kills, currentTimeS, playerNames, maxVisible = 5, className }: DemoKillFeedProps) {
    const visible = kills
        .filter((k) => k.time_s <= currentTimeS)
        .sort((a, b) => b.time_s - a.time_s)
        .slice(0, maxVisible);

    if (visible.length === 0) {
        return (
            <div className={cn('flex flex-col gap-1.5', className)}>
                <Text variant="muted">No kills yet.</Text>
            </div>
        );
    }

    return (
        <div className={cn('flex flex-col gap-1.5', className)}>
            {visible.map((kill, index) => (
                <div key={`${kill.time_s}-${index}`} className="flex items-center gap-2 text-sm">
                    <Skull className="text-muted-foreground size-3.5 shrink-0" />
                    <Text variant="body" className="min-w-0 truncate">
                        {nameFor(kill.killer_steam_id, playerNames)}
                    </Text>
                    <Text variant="muted" className="shrink-0 lowercase">
                        {kill.weapon}
                    </Text>
                    <Text variant="body" className="min-w-0 truncate">
                        {nameFor(kill.victim_steam_id, playerNames)}
                    </Text>
                    {kill.headshot && (
                        <Badge tone="negative" className="ml-auto shrink-0">
                            HS
                        </Badge>
                    )}
                </div>
            ))}
        </div>
    );
}
