import { Badge, type BadgeProps } from '../primitives/Badge';
import { Card } from '../primitives/Card';
import { Text } from '../primitives/Text';

export interface RosterCardProps {
    name: string;
    avatarUrl?: string | null;
    status: { label: string; tone: BadgeProps['tone'] };
    faceit?: { level: number; elo: number } | null;
    playtimeLabel?: string | null;
}

export function RosterCard({ name, avatarUrl, status, faceit, playtimeLabel }: RosterCardProps) {
    return (
        <Card className="flex items-center gap-4">
            {avatarUrl ? (
                <img src={avatarUrl} alt="" className="size-12 rounded-md" />
            ) : (
                <div className="size-12 rounded-md bg-muted" />
            )}
            <div className="min-w-0 flex-1">
                <Text variant="body" className="truncate font-medium">
                    {name}
                </Text>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                    <Badge tone={status.tone}>{status.label}</Badge>
                    {faceit && <Badge tone="info">Faceit {faceit.level} · {faceit.elo}</Badge>}
                </div>
                {playtimeLabel && (
                    <Text variant="muted" className="mt-1">
                        {playtimeLabel}
                    </Text>
                )}
            </div>
        </Card>
    );
}
