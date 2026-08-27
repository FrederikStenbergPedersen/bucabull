import { Head, Link, router, usePage } from '@inertiajs/react';
import { Badge, Button, RosterCard, Text, type BadgeProps } from '@newapp/ui';

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
    team: Team;
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
        <div className="min-h-svh bg-background p-6">
            <Head title={team.name} />

            <header className="mx-auto flex max-w-3xl items-center justify-between">
                <div>
                    <Text variant="muted" className="font-heading tracking-wide uppercase">
                        {isOwnTeam ? 'Your team' : team.name}
                    </Text>
                    <Text variant="heading">{team.name}</Text>
                </div>

                {auth?.user ? (
                    <Button variant="secondary" onClick={() => router.post(route('logout'))}>
                        Log out
                    </Button>
                ) : (
                    <Link href={route('login')}>
                        <Button>Log in with Steam</Button>
                    </Link>
                )}
            </header>

            <main className="mx-auto mt-8 flex max-w-3xl flex-col gap-3">
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
            </main>
        </div>
    );
}
