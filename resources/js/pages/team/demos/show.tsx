import {
    Badge,
    type BadgeProps,
    DemoKillFeed,
    DemoLoadoutPanel,
    DemoRadar,
    type DemoRadarHandle,
    DemoRadarOverlay,
    DemoRoundStrip,
    DemoTransportControls,
    TeamLayout,
    Text,
} from '@bucabull/ui';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useRef, useState } from 'react';

import { DemoUpload } from '@/components/demo-upload';
import { PLAYBACK_SPEEDS, useDemoPlayback } from '@/hooks/use-demo-playback';
import { useTeamNav } from '@/hooks/use-team-nav';
import { type SharedData } from '@/types';
import { type DemoRecord, type DemoReplay, type MapRadarCalibration, type PlayerLoadout, type TeamSide } from '@/types/demo';

interface DemoShowProps {
    demo: DemoRecord;
    mapRadar: MapRadarCalibration | null;
    /** The FaceitMatch id backing this demo — only used for the retry-upload action on a failed parse, see DemoController@show. */
    matchId: number;
}

const STATUS_BADGE: Record<DemoRecord['status'], { label: string; tone: BadgeProps['tone'] }> = {
    processing: { label: 'Processing', tone: 'info' },
    ready: { label: 'Ready', tone: 'positive' },
    failed: { label: 'Failed', tone: 'negative' },
};

function durationLabel(seconds: number | null) {
    if (!seconds) return null;
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m`;
}

/**
 * Persistent team identity, independent of which side ("CT"/"T") a team
 * is currently playing — teams switch sides at halftime, so "CT" alone
 * can't be used as a running score bucket across a whole match without
 * silently merging both teams' wins together once they swap. "A"/"B" are
 * arbitrary labels, not tied to either side.
 */
type TeamKey = 'A' | 'B';

/** Maps every player who appears in `loadouts` to a persistent team, using that round's CT/T split as the assignment. Meant to be called once, on the earliest round with loadout data, to fix each player's team for the rest of the match. */
function assignTeams(loadouts: PlayerLoadout[]): Record<string, TeamKey> {
    const steamIdToTeam: Record<string, TeamKey> = {};
    for (const loadout of loadouts) {
        if (loadout.team === 'CT') steamIdToTeam[loadout.steam_id] = 'A';
        else if (loadout.team === 'T') steamIdToTeam[loadout.steam_id] = 'B';
    }
    return steamIdToTeam;
}

/**
 * Which persistent team is currently playing CT and which is playing T,
 * read from one round's own roster rather than assumed fixed — this is
 * what actually changes at halftime. Majority vote per side rather than
 * trusting a single player, in case a substitution mid-match left someone
 * out of `steamIdToTeam`.
 */
function sideTeamsFor(loadouts: PlayerLoadout[], steamIdToTeam: Record<string, TeamKey>): Partial<Record<TeamSide, TeamKey>> {
    const votes: Record<'CT' | 'T', Record<TeamKey, number>> = { CT: { A: 0, B: 0 }, T: { A: 0, B: 0 } };

    for (const loadout of loadouts) {
        const team = steamIdToTeam[loadout.steam_id];
        if (team && (loadout.team === 'CT' || loadout.team === 'T')) votes[loadout.team][team]++;
    }

    const majority = (side: 'CT' | 'T'): TeamKey | undefined => {
        const { A, B } = votes[side];
        return A === 0 && B === 0 ? undefined : A >= B ? 'A' : 'B';
    };

    return { CT: majority('CT'), T: majority('T') };
}

/**
 * Fetched separately from the Inertia payload (DemoController@data) — a
 * full replay can be several MB, which belongs in a normal, cacheable
 * HTTP response, not a page prop re-sent on every Inertia visit.
 */
function useReplay(demoId: number, enabled: boolean) {
    const [replay, setReplay] = useState<DemoReplay | null>(null);
    const [error, setError] = useState(false);

    useEffect(() => {
        if (!enabled) return;

        let cancelled = false;
        setError(false);

        fetch(route('team.demos.data', demoId))
            .then((res) => {
                if (!res.ok) throw new Error(`${res.status}`);
                return res.json();
            })
            .then((data: DemoReplay) => {
                if (!cancelled) setReplay(data);
            })
            .catch(() => {
                if (!cancelled) setError(true);
            });

        return () => {
            cancelled = true;
        };
    }, [demoId, enabled]);

    return { replay, error };
}

export default function DemoShow({ demo, mapRadar, matchId }: DemoShowProps) {
    const { auth } = usePage<SharedData>().props;
    const navItems = useTeamNav();
    const badge = STATUS_BADGE[demo.status];
    const { replay, error: replayError } = useReplay(demo.id, demo.status === 'ready');

    // Single playback instance, shared by everything below (loadout
    // panels, radar, transport controls, round strip, kill feed) — all
    // need to stay in sync (picking a round has to move the radar too),
    // so this can't be split into independent hook calls.
    const playback = useDemoPlayback(replay);
    const radarRef = useRef<DemoRadarHandle>(null);

    useEffect(() => playback.subscribe((frame) => radarRef.current?.draw(frame)), [playback]);

    // Kills only carry steam IDs, not names — build the lookup once per
    // round from its own frame data (every player who appears at all in
    // the round shows up in at least one sampled frame).
    const playerNames = useMemo(() => {
        const names: Record<string, string> = {};
        for (const frame of playback.round?.frames ?? []) {
            for (const player of frame.players) {
                names[player.steam_id] = player.name;
            }
        }
        return names;
    }, [playback.round]);

    // Round.loadouts is a once-per-round snapshot (money/weapons at
    // freeze-time-end) — split by team for the two flanking panels.
    // Optional-chained past `loadouts` itself, not just `round`: a demo
    // parsed before this field existed has a stored parsed.json without
    // it, so `round.loadouts` is undefined rather than an empty array.
    const ctLoadouts = useMemo(() => playback.round?.loadouts?.filter((l) => l.team === 'CT') ?? [], [playback.round]);
    const tLoadouts = useMemo(() => playback.round?.loadouts?.filter((l) => l.team === 'T') ?? [], [playback.round]);

    // Live health/is_alive, throttled to ~10Hz via useDemoPlayback's
    // `players` — separate from the static loadout snapshot above.
    const live = useMemo(
        () => Object.fromEntries(playback.players.map((p) => [p.steam_id, { health: p.health, is_alive: p.is_alive }])),
        [playback.players],
    );

    // Running per-team win tally, for both the loadout panels' score
    // headers and the round strip's per-tab score label. Teams swap sides
    // at halftime, so this can't just count "CT" vs "T" wins across the
    // whole match — see assignTeams/sideTeamsFor. Team identity is fixed
    // once, from the earliest round with loadout data (the knife round,
    // when present); each round after that re-reads which team is
    // currently on which side from that round's own roster.
    const roundStripData = useMemo(() => {
        const rounds = replay?.rounds ?? [];
        const identityRound = rounds.find((r) => r.loadouts.length > 0);
        const steamIdToTeam = assignTeams(identityRound?.loadouts ?? []);

        const score: Record<TeamKey, number> = { A: 0, B: 0 };

        return rounds.map((round) => {
            const sideTeams = sideTeamsFor(round.loadouts, steamIdToTeam);

            // The knife round only decides side picks, not the match score.
            if (!round.is_knife_round && round.winner) {
                const winningTeam = sideTeams[round.winner];
                if (winningTeam) score[winningTeam]++;
            }

            return {
                roundNumber: round.round_number,
                winner: round.winner,
                isKnifeRound: round.is_knife_round,
                ctScore: sideTeams.CT ? score[sideTeams.CT] : 0,
                tScore: sideTeams.T ? score[sideTeams.T] : 0,
            };
        });
    }, [replay]);

    // Score going into the *current* round (before its own result), not
    // including it — matches the reference product's scoreboard header.
    const currentScore = roundStripData[playback.roundIndex - 1] ?? { ctScore: 0, tScore: 0 };

    return (
        <TeamLayout
            navItems={navItems}
            onLogout={auth?.user ? () => router.post(route('logout')) : undefined}
            linkAs={Link}
            contentClassName="max-w-3xl lg:max-w-7xl"
        >
            <Head title={`${demo.map} · Demo`} />

            <div className="animate-fade-in-up">
                <Badge tone={badge.tone} className="mb-3">
                    {badge.label}
                </Badge>
                <Text variant="heading">{demo.map}</Text>

                {demo.status === 'processing' && (
                    <Text variant="muted" className="mt-2">
                        Parsing this demo — check back shortly.
                    </Text>
                )}

                {demo.status === 'failed' && (
                    <div className="mt-2 flex flex-col items-start gap-2">
                        <Text variant="muted" className="text-destructive">
                            {demo.error_message ?? 'Something went wrong parsing this demo.'}
                        </Text>
                        <DemoUpload matchId={matchId} demo={demo} />
                    </div>
                )}

                {demo.status === 'ready' && !replay && !replayError && (
                    <Text variant="muted" className="mt-2">
                        {[demo.round_count !== null ? `${demo.round_count} rounds` : null, durationLabel(demo.duration_seconds)]
                            .filter(Boolean)
                            .join(' · ') || 'Loading replay…'}
                    </Text>
                )}

                {replayError && (
                    <Text variant="muted" className="text-destructive mt-2">
                        Couldn't load the replay data — try refreshing the page.
                    </Text>
                )}

                {demo.status === 'ready' && replay && replay.rounds.length === 0 && (
                    <Text variant="muted" className="mt-2">
                        This demo parsed successfully but has no rounds to replay.
                    </Text>
                )}
            </div>

            {demo.status === 'ready' &&
                replay &&
                replay.rounds.length > 0 &&
                (mapRadar ? (
                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[14rem_minmax(0,1fr)_14rem]">
                        <DemoLoadoutPanel team="CT" teamLabel="Counter-Terrorists" score={currentScore.ctScore} players={ctLoadouts} live={live} />

                        <div className="flex flex-col gap-4">
                            <div className="relative">
                                <DemoRadar
                                    ref={radarRef}
                                    calibration={mapRadar}
                                    grenades={playback.round?.grenades ?? []}
                                    kills={playback.round?.kills ?? []}
                                    tickRate={replay.tick_rate}
                                />
                                <DemoRadarOverlay>
                                    <Text variant="muted" className="mb-2 text-xs tracking-wide uppercase">
                                        Kills
                                    </Text>
                                    <DemoKillFeed kills={playback.round?.kills ?? []} currentTimeS={playback.timeS} playerNames={playerNames} />
                                </DemoRadarOverlay>
                            </div>

                            <DemoTransportControls
                                isPlaying={playback.isPlaying}
                                onTogglePlay={playback.togglePlay}
                                timeS={playback.timeS}
                                durationS={playback.durationS}
                                onSeek={playback.seek}
                                speed={playback.speed}
                                speedOptions={[...PLAYBACK_SPEEDS]}
                                onSpeedChange={playback.setSpeed}
                                onPrevRound={playback.prevRound}
                                onNextRound={playback.nextRound}
                                canGoPrevRound={playback.roundIndex > 0}
                                canGoNextRound={playback.roundIndex < replay.rounds.length - 1}
                            />

                            <DemoRoundStrip rounds={roundStripData} activeIndex={playback.roundIndex} onSelect={playback.goToRound} />
                        </div>

                        <DemoLoadoutPanel team="T" teamLabel="Terrorists" score={currentScore.tScore} players={tLoadouts} live={live} />
                    </div>
                ) : (
                    <Text variant="muted">Radar art isn&apos;t available for {demo.map} yet.</Text>
                ))}
        </TeamLayout>
    );
}
