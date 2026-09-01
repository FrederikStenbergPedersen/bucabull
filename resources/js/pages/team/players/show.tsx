import { Badge, type BadgeProps, MatchCard, RosterCard, TeamLayout, Text } from '@bucabull/ui';
import { Head, Link, router, usePage } from '@inertiajs/react';

import { useTeamNav } from '@/hooks/use-team-nav';
import { type SharedData } from '@/types';

interface PlayerStat {
    steam_persona_state: number | null;
    steam_last_seen_at: string | null;
    playtime_2weeks_minutes: number | null;
    faceit_skill_level: number | null;
    faceit_elo: number | null;
    faceit_region: string | null;
    faceit_player_id: string | null;
    faceit_lifetime_matches: number | null;
    faceit_lifetime_win_rate: number | null;
    faceit_lifetime_avg_kd: number | null;
}

interface Player {
    id: number;
    nickname: string;
    avatar: string | null;
    player_stat: PlayerStat | null;
}

interface FaceitMatch {
    id: number;
    map: string;
    map_overview: string | null;
    result: boolean;
    score: string | null;
    kills: number | null;
    deaths: number | null;
    assists: number | null;
    kd_ratio: number | null;
    played_at: string | null;
}

interface PlayerMatchHistoryProps {
    player: Player;
    matches: FaceitMatch[];
}

// Mirrors home.tsx's PERSONA_STATES/statusFor — duplicated rather than
// shared because home.tsx keeps this inline too (see its PlayerStat
// interface comment); promote both to a shared helper if a third page
// needs it.
const PERSONA_STATES: Record<number, { label: string; tone: BadgeProps['tone'] }> = {
    0: { label: 'Offline', tone: 'negative' },
    1: { label: 'Online', tone: 'positive' },
    2: { label: 'Busy', tone: 'neutral' },
    3: { label: 'Away', tone: 'neutral' },
    4: { label: 'Snooze', tone: 'muted' },
    5: { label: 'Looking to trade', tone: 'neutral' },
    6: { label: 'Looking to play', tone: 'positive' },
};

function statusFor(state: number | null) {
    if (state === null) return { label: 'Unknown', tone: 'muted' as const };
    return PERSONA_STATES[state] ?? { label: 'Unknown', tone: 'muted' as const };
}

function playtimeLabel(minutes: number | null) {
    if (minutes === null) return null;
    return `${(minutes / 60).toFixed(1)}h · last 2 weeks`;
}

// Mirrors home.tsx's lifetimeStatsLabel — see that copy's comment on why
// this is "lifetime" rather than "season".
function lifetimeStatsLabel(stat: PlayerStat | null) {
    if (!stat?.faceit_lifetime_matches) return null;
    const parts: string[] = [];
    if (stat.faceit_lifetime_win_rate !== null) parts.push(`${stat.faceit_lifetime_win_rate}% WR`);
    parts.push(`${stat.faceit_lifetime_matches} matches`);
    if (stat.faceit_lifetime_avg_kd !== null) parts.push(`${stat.faceit_lifetime_avg_kd.toFixed(2)} avg K/D`);
    return parts.join(' · ');
}

function relativeDate(iso: string | null) {
    if (!iso) return null;
    const diffMs = Date.now() - new Date(iso).getTime();
    const diffHours = Math.round(diffMs / (60 * 60 * 1000));
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.round(diffHours / 24)}d ago`;
}

function kdLabel(match: FaceitMatch) {
    if (match.kills === null && match.deaths === null) return null;
    return `${match.kills ?? '–'} / ${match.deaths ?? '–'} / ${match.assists ?? '–'}`;
}

export default function PlayerMatchHistory({ player, matches }: PlayerMatchHistoryProps) {
    const { auth } = usePage<SharedData>().props;
    const stat = player.player_stat;
    const navItems = useTeamNav();

    return (
        <TeamLayout navItems={navItems} onLogout={auth?.user ? () => router.post(route('logout')) : undefined} linkAs={Link}>
            <Head title={`${player.nickname} · Match history`} />

            <div className="animate-fade-in-up" style={{ animationDelay: '80ms' }}>
                <Badge tone="info" className="mb-3">
                    Match history
                </Badge>
                <RosterCard
                    name={player.nickname}
                    avatarUrl={player.avatar}
                    status={statusFor(stat?.steam_persona_state ?? null)}
                    faceit={stat?.faceit_skill_level && stat?.faceit_elo ? { level: stat.faceit_skill_level, elo: stat.faceit_elo } : null}
                    playtimeLabel={playtimeLabel(stat?.playtime_2weeks_minutes ?? null)}
                    lifetimeStatsLabel={lifetimeStatsLabel(stat ?? null)}
                />
            </div>

            <div className="flex flex-col gap-3">
                {matches.length === 0 && (
                    <Text variant="muted" className="animate-fade-in-up" style={{ animationDelay: '160ms' }}>
                        {stat?.faceit_player_id
                            ? 'No recent Faceit matches yet.'
                            : "No Faceit account linked — this player's recent matches will show up here once one is."}
                    </Text>
                )}
                {matches.map((match, index) => (
                    <div key={match.id} className="animate-fade-in-up" style={{ animationDelay: `${160 + index * 70}ms` }}>
                        <MatchCard
                            map={match.map}
                            mapOverview={match.map_overview}
                            result={match.result ? { label: 'Win', tone: 'positive' } : { label: 'Loss', tone: 'negative' }}
                            score={match.score}
                            kdLabel={kdLabel(match)}
                            playedAtLabel={relativeDate(match.played_at)}
                        />
                    </div>
                ))}
            </div>
        </TeamLayout>
    );
}
