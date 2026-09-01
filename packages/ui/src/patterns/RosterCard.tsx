import { ElementType } from 'react';

import { Badge, type BadgeProps } from '../primitives/Badge';
import { LinkableCard } from '../primitives/LinkableCard';
import { Text } from '../primitives/Text';
import { FaceitBadge } from './FaceitBadge';

export interface RosterCardProps {
    name: string;
    avatarUrl?: string | null;
    status: { label: string; tone: BadgeProps['tone'] };
    faceit?: { level: number; elo: number } | null;
    playtimeLabel?: string | null;
    /**
     * Pre-formatted line of FACEIT lifetime numbers (win rate, matches
     * played, average K/D) — formatted by the caller rather than passed
     * as structured data, same convention as `playtimeLabel`. FACEIT's
     * Data API has no season concept for regular matchmaking, so this is
     * the player's whole history, not a season slice.
     */
    lifetimeStatsLabel?: string | null;
    /** When set, the whole card becomes a link (e.g. to that player's match history). */
    href?: string;
    /** Injects Inertia's `Link` (or another router component) in place of a plain `<a>` — keeps this package framework-agnostic. */
    linkAs?: ElementType;
}

export function RosterCard({ name, avatarUrl, status, faceit, playtimeLabel, lifetimeStatsLabel, href, linkAs }: RosterCardProps) {
    return (
        <LinkableCard href={href} linkAs={linkAs}>
            {avatarUrl ? <img src={avatarUrl} alt="" className="size-12 rounded-md" /> : <div className="bg-muted size-12 rounded-md" />}
            <div className="min-w-0 flex-1">
                <Text variant="body" className="truncate font-medium">
                    {name}
                </Text>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                    <Badge tone={status.tone}>{status.label}</Badge>
                    {faceit && <FaceitBadge level={faceit.level} elo={faceit.elo} />}
                </div>
                {playtimeLabel && (
                    <Text variant="muted" className="mt-1">
                        {playtimeLabel}
                    </Text>
                )}
                {lifetimeStatsLabel && (
                    <Text variant="muted" className="mt-1">
                        {lifetimeStatsLabel}
                    </Text>
                )}
            </div>
        </LinkableCard>
    );
}
