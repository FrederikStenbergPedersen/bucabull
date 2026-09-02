import {
    Badge,
    type BadgeProps,
    DemoKillFeed,
    DemoRadar,
    type DemoRadarHandle,
    DemoRoundList,
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
import { type DemoRecord, type DemoReplay, type MapRadarCalibration } from '@/types/demo';

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

    // Single playback instance, shared by the round list (sidebar) and
    // the radar/transport controls/kill feed (main content) below — all
    // need to stay in sync (picking a round in the sidebar has to move
    // the radar), so this can't be split into independent hook calls.
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

    const sidebarExtra = replay?.rounds.length ? (
        <DemoRoundList
            rounds={replay.rounds.map((round) => ({ roundNumber: round.round_number, winner: round.winner }))}
            activeIndex={playback.roundIndex}
            onSelect={playback.goToRound}
        />
    ) : undefined;

    return (
        <TeamLayout
            navItems={navItems}
            onLogout={auth?.user ? () => router.post(route('logout')) : undefined}
            linkAs={Link}
            sidebarExtra={sidebarExtra}
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
                    <div className="flex flex-col gap-4">
                        <DemoRadar ref={radarRef} calibration={mapRadar} grenades={playback.round?.grenades ?? []} />
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
                        <div className="border-border bg-card rounded-md border p-4">
                            <Text variant="muted" className="mb-2 text-xs tracking-wide uppercase">
                                Kills
                            </Text>
                            <DemoKillFeed kills={playback.round?.kills ?? []} currentTimeS={playback.timeS} playerNames={playerNames} />
                        </div>
                    </div>
                ) : (
                    <Text variant="muted">Radar art isn&apos;t available for {demo.map} yet.</Text>
                ))}
        </TeamLayout>
    );
}
