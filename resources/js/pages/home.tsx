import { Badge, Button, RosterCard, SteamSignInButton, Text, type BadgeProps } from '@bucabull/ui';
import { Head, router, usePage } from '@inertiajs/react';

import { type SharedData } from '@/types';

interface PlayerStat {
    steam_persona_state: number | null;
    steam_last_seen_at: string | null;
    playtime_2weeks_minutes: number | null;
    faceit_skill_level: number | null;
    faceit_elo: number | null;
    faceit_region: string | null;
}

interface Player {
    id: number;
    nickname: string;
    avatar: string | null;
    playerStat: PlayerStat | null;
}

interface Team {
    id: number;
    name: string;
    slug: string;
    invite_code: string;
    users: Player[];
}

interface HomeProps {
    team: Team | null;
    isOwnTeam: boolean;
}

const PERSONA_STATES: Record<number, { label: string; tone: BadgeProps['tone'] }> = {
    0: { label: 'Offline', tone: 'muted' },
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

export default function Home({ team, isOwnTeam }: HomeProps) {
    const { auth } = usePage<SharedData>().props;

    return (
        <div className="relative min-h-svh overflow-hidden bg-background">
            <Head title={team?.name ?? 'Bucabull eSports'} />

            <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-accent/25 blur-3xl" />
                <div className="absolute -top-24 right-0 h-96 w-96 rounded-full bg-accent-secondary/20 blur-3xl" />
            </div>

            <header className="relative mx-auto flex max-w-3xl items-center justify-between p-6">
                <Text variant="subheading" className="tracking-wide uppercase">
                    Bucabull
                </Text>
                {auth?.user && (
                    <Button variant="secondary" onClick={() => router.post(route('logout'))}>
                        Log out
                    </Button>
                )}
            </header>

            {team ? (
                <main className="relative mx-auto flex max-w-3xl flex-col gap-6 px-6 pb-16">
                    <div className="flex flex-wrap items-end justify-between gap-4">
                        <div>
                            <Badge tone="info" className="mb-3">
                                {isOwnTeam ? 'Your team' : 'Home team'}
                            </Badge>
                            <Text variant="display">{team.name}</Text>
                        </div>
                        {!auth?.user && (
                            <div className="flex flex-col items-start gap-2">
                                <Text variant="muted">Sign in to access the team's features</Text>
                                <SteamSignInButton href={route('steam.redirect')} />
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col gap-3">
                        {team.users.map((player) => {
                            const stat = player.playerStat;
                            return (
                                <RosterCard
                                    key={player.id}
                                    name={player.nickname}
                                    avatarUrl={player.avatar}
                                    status={statusFor(stat?.steam_persona_state ?? null)}
                                    faceit={
                                        stat?.faceit_skill_level && stat?.faceit_elo
                                            ? { level: stat.faceit_skill_level, elo: stat.faceit_elo }
                                            : null
                                    }
                                    playtimeLabel={playtimeLabel(stat?.playtime_2weeks_minutes ?? null)}
                                />
                            );
                        })}
                        {team.users.length === 0 && <Text variant="muted">No players on this team yet.</Text>}
                    </div>
                </main>
            ) : (
                <main className="relative mx-auto flex max-w-2xl flex-col items-center gap-6 px-6 pt-20 pb-24 text-center">
                    <Badge tone="info">Bucabull eSports</Badge>
                    <Text variant="display">Steam status, Faceit rank, one roster.</Text>
                    <Text variant="muted" className="max-w-md">
                        Sign in with Steam to create the team and start tracking who's online, ranked, and grinding.
                    </Text>
                    <SteamSignInButton href={route('steam.redirect')} />
                </main>
            )}
        </div>
    );
}
