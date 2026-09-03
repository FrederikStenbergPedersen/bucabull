import { ReactNode } from 'react';

import { cn } from '../lib/cn';
import { Badge, type BadgeProps } from '../primitives/Badge';
import { LinkableCard } from '../primitives/LinkableCard';
import { Text } from '../primitives/Text';

export interface MatchCardProps {
    map: string;
    /** The map's curated overview photo, resolved server-side (see App\Support\MapOverview) — shown full-bleed behind the card, same treatment as SidebarNavItem. Falls back to the plain card when null (custom map with no match). */
    mapOverview?: string | null;
    result: { label: string; tone: BadgeProps['tone'] };
    score?: string | null;
    kdLabel?: string | null;
    playedAtLabel?: string | null;
    /** Extra content below the main row — currently used for the demo upload/watch action (see DemoStatusAction). */
    footer?: ReactNode;
}

/** One row in a player's match history — built on the same LinkableCard chrome as RosterCard rather than duplicating it. */
export function MatchCard({ map, mapOverview, result, score, kdLabel, playedAtLabel, footer }: MatchCardProps) {
    return (
        <LinkableCard className={cn('flex-col items-stretch', footer && 'gap-3')} backgroundImage={mapOverview}>
            <div className="flex items-center justify-between">
                <div className="min-w-0">
                    <Text variant="body" className={cn('truncate font-medium', mapOverview && 'text-white drop-shadow')}>
                        {map}
                    </Text>
                    {playedAtLabel && (
                        <Text variant="muted" className={cn('mt-1', mapOverview && 'text-white/75 drop-shadow')}>
                            {playedAtLabel}
                        </Text>
                    )}
                </div>
                <div className="flex shrink-0 items-center gap-3">
                    {kdLabel && (
                        <Text variant="muted" className={cn(mapOverview && 'text-white/75 drop-shadow')}>
                            {kdLabel}
                        </Text>
                    )}
                    {score && (
                        <Text variant="body" className={cn('font-mono', mapOverview && 'text-white drop-shadow')}>
                            {score}
                        </Text>
                    )}
                    {/* Badge's tone colors are a light tint meant for the solid card background — over a busy photo that washes out, so pin a solid dark backdrop underneath it, same fix as SidebarNavItem's trailing pill. */}
                    <Badge tone={result.tone} className={cn(mapOverview && 'bg-black/55')}>
                        {result.label}
                    </Badge>
                </div>
            </div>
            {footer && <div className="flex items-center justify-end">{footer}</div>}
        </LinkableCard>
    );
}
