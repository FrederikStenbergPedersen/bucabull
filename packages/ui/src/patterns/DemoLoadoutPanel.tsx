import { Skull } from 'lucide-react';

import { cn } from '../lib/cn';
import { Text } from '../primitives/Text';

export interface DemoLoadoutWeapon {
    name: string;
    class: string; // pistol | smg | heavy | rifle | equipment | grenade | unknown
    icon_key: string; // "" for items with no loadout icon (armor, defuse kit, grenades, ...)
}

export interface DemoLoadoutPlayer {
    steam_id: string;
    name: string;
    money: number;
    weapons: DemoLoadoutWeapon[];
}

export interface DemoLoadoutLiveState {
    health: number;
    is_alive: boolean;
}

export interface DemoLoadoutPanelProps {
    team: 'CT' | 'T';
    teamLabel: string;
    /** Rounds won so far (before this round), matching the reference product's scoreboard-style header. */
    score: number;
    /** This team's players for the current round — from Round.loadouts, a once-per-round snapshot (see the type's own comment), not resampled. */
    players: DemoLoadoutPlayer[];
    /** steam_id -> live health/is_alive, throttled to ~10Hz — see useDemoPlayback's `players`. A player missing here (data not loaded yet) renders as full health/alive rather than blocking the row. */
    live: Record<string, DemoLoadoutLiveState>;
    className?: string;
}

// Highest-tier weapon wins the row's icon — Zeus/Knife sit in the
// "equipment" class alongside armor/defuse kit/etc, so they're matched by
// icon_key directly rather than by class.
const CLASS_PRIORITY = ['rifle', 'heavy', 'smg', 'pistol'];

function pickPrimaryWeapon(weapons: DemoLoadoutWeapon[]): DemoLoadoutWeapon | null {
    for (const cls of CLASS_PRIORITY) {
        const found = weapons.find((w) => w.class === cls && w.icon_key);
        if (found) return found;
    }

    return weapons.find((w) => w.icon_key === 'zeus') ?? weapons.find((w) => w.icon_key === 'knife') ?? null;
}

/**
 * One team's column of loadout rows, meant to flank DemoRadar — HP/alive
 * status (live, throttled to ~10Hz via useDemoPlayback's `players`),
 * name, weapon icon and remaining money per player, styled after a
 * competitor CS2 demo viewer's loadout boxes. `players`' money/weapons
 * are a once-per-round snapshot (see DemoLoadoutPlayer's source type,
 * PlayerLoadout) — only health/is_alive update through the round.
 */
export function DemoLoadoutPanel({ team, teamLabel, score, players, live, className }: DemoLoadoutPanelProps) {
    const teamColorClass = team === 'CT' ? 'text-team-ct' : 'text-team-t';

    return (
        <div className={cn('flex flex-col gap-2', className)}>
            <div className="flex items-baseline justify-between">
                <Text variant="muted" className="text-xs tracking-wide uppercase">
                    {teamLabel}
                </Text>
                <Text variant="subheading" className={teamColorClass}>
                    {score}
                </Text>
            </div>

            <div className="flex flex-col gap-1">
                {players.map((player) => {
                    const state = live[player.steam_id];
                    const isAlive = state?.is_alive ?? true;
                    const health = state?.health ?? 100;
                    const primary = pickPrimaryWeapon(player.weapons);

                    return (
                        <div
                            key={player.steam_id}
                            className={cn(
                                'border-border bg-card flex items-center gap-2 rounded-md border px-2 py-1.5 text-sm',
                                !isAlive && 'opacity-60',
                            )}
                        >
                            {isAlive ? (
                                <Text variant="body" className="w-7 shrink-0 tabular-nums">
                                    {health}
                                </Text>
                            ) : (
                                <Skull className="text-destructive size-4 w-7 shrink-0" />
                            )}

                            <Text variant="body" className="min-w-0 flex-1 truncate">
                                {player.name}
                            </Text>

                            {primary && (
                                <span className="flex size-6 shrink-0 items-center justify-center rounded bg-black/85 p-1">
                                    <img
                                        src={`/weapons/${primary.icon_key}.svg`}
                                        alt={primary.name}
                                        className="max-h-full max-w-full object-contain"
                                    />
                                </span>
                            )}

                            <Text variant="muted" className="w-12 shrink-0 text-right tabular-nums">
                                ${player.money}
                            </Text>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
