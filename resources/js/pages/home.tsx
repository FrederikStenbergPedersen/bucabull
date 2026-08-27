import { AmbientBackdrop, Badge, Button, EmptySlotCard, RosterCard, SteamSignInButton, Text, type BadgeProps } from '@bucabull/ui';
import { Head, router, usePage } from '@inertiajs/react';
import { useState } from 'react';

import { type SharedData } from '@/types';

const ROSTER_SIZE = 5;

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
    player_stat: PlayerStat | null;
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

function InviteCode({ code }: { code: string }) {
    const [copied, setCopied] = useState(false);

    async function copy() {
        await navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    }

    return (
        <button
            type="button"
            onClick={copy}
            className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-dashed border-border px-3 py-1.5 text-sm transition-colors hover:border-accent-secondary"
        >
            <Text as="span" variant="muted">
                Invite code
            </Text>
            <Text as="span" className="font-mono tracking-widest">
                {code}
            </Text>
            <Text as="span" variant="muted">
                {copied ? 'Copied!' : 'Copy'}
            </Text>
        </button>
    );
}

export default function Home({ team, isOwnTeam }: HomeProps) {
    const { auth } = usePage<SharedData>().props;
    const players = team?.users ?? [];
    const openSlots = Math.max(0, ROSTER_SIZE - players.length);

    return (
        <div className="relative min-h-svh overflow-hidden bg-background">
            <Head title={team?.name ?? 'Bucabull eSports'} />

            <AmbientBackdrop />

            <header className="animate-fade-in-up relative mx-auto flex max-w-3xl items-center justify-between p-6">
                <Text variant="subheading" className="tracking-wide uppercase">
                    Bucabull
                </Text>
                {auth?.user && (
                    <Button variant="secondary" onClick={() => router.post(route('logout'))}>
                        Log out
                    </Button>
                )}
            </header>

            <main className="relative mx-auto flex max-w-3xl flex-col gap-6 px-6 pb-16">
                <div
                    className="animate-fade-in-up flex flex-wrap items-end justify-between gap-4"
                    style={{ animationDelay: '80ms' }}
                >
                    <div>
                        <Badge tone="info" className="mb-3">
                            {team ? (isOwnTeam ? 'Your team' : 'Home team') : 'Bucabull eSports'}
                        </Badge>
                        <Text variant="display">{team?.name ?? 'Bucabull'}</Text>
                        <Text variant="muted" className="mt-2">
                            Steam status, Faceit rank, one roster.
                        </Text>
                    </div>
                    {!auth?.user && (
                        <div className="flex flex-col items-start gap-2">
                            <Text variant="muted">Sign in to access the team's features</Text>
                            <SteamSignInButton href={route('steam.redirect')} />
                        </div>
                    )}
                    {isOwnTeam && auth?.user && team && <InviteCode code={team.invite_code} />}
                </div>

                <div className="flex flex-col gap-3">
                    {players.map((player, index) => {
                        const stat = player.player_stat;
                        return (
                            <div
                                key={player.id}
                                className="animate-fade-in-up"
                                style={{ animationDelay: `${160 + index * 70}ms` }}
                            >
                                <RosterCard
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
                            </div>
                        );
                    })}
                    {Array.from({ length: openSlots }).map((_, index) => (
                        <div
                            key={`open-${index}`}
                            className="animate-fade-in-up"
                            style={{ animationDelay: `${160 + (players.length + index) * 70}ms` }}
                        >
                            <EmptySlotCard />
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
}
