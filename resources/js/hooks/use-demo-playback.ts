import { useCallback, useEffect, useRef, useState } from 'react';

import { type DemoReplay, type Frame, type PlayerFrame, type Round } from '@/types/demo';

export const PLAYBACK_SPEEDS = [0.5, 1, 2, 4] as const;

export interface DemoPlaybackState {
    roundIndex: number;
    round: Round | null;
    isPlaying: boolean;
    speed: number;
    /** Throttled to ~10Hz — for React-rendered UI (time label, round list highlight), not per-frame rendering. See `subscribe` for that. */
    timeS: number;
    durationS: number;
    /** The current frame's players, throttled to the same ~10Hz cadence as `timeS` — for reactive (non-canvas) UI like the loadout panels that just needs a plain number/boolean update (health, is_alive), not DemoRadar's smoothly-interpolated 60fps positions. See `subscribe` for that. */
    players: PlayerFrame[];
}

export interface DemoPlaybackControls {
    play: () => void;
    pause: () => void;
    togglePlay: () => void;
    seek: (timeS: number) => void;
    setSpeed: (speed: number) => void;
    goToRound: (index: number) => void;
    nextRound: () => void;
    prevRound: () => void;
    /**
     * Subscribe to every animation-frame's interpolated player positions.
     * This is how DemoRadar gets per-frame data WITHOUT the hook's
     * consumer re-rendering 60x/sec — it calls its canvas draw() directly
     * from the callback, bypassing React state entirely for the hot path.
     */
    subscribe: (callback: (frame: Frame | null) => void) => () => void;
}

function lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
}

// Shortest-path angle interpolation in degrees — a naive lerp between
// e.g. 359° and 1° would spin the long way around through 180° instead
// of the 2° it actually should.
function lerpAngle(a: number, b: number, t: number): number {
    const delta = ((((b - a) % 360) + 540) % 360) - 180;
    return a + delta * t;
}

function interpolateFrame(from: Frame, to: Frame, t: number): Frame {
    const toBySteamId = new Map(to.players.map((p) => [p.steam_id, p]));

    return {
        tick: Math.round(lerp(from.tick, to.tick, t)),
        time_s: lerp(from.time_s, to.time_s, t),
        players: from.players.map((fromPlayer) => {
            const toPlayer = toBySteamId.get(fromPlayer.steam_id);
            // A player who died/disconnected between these two samples
            // has nothing to interpolate toward — hold their last known
            // frame rather than guessing.
            if (!toPlayer) return fromPlayer;

            return {
                ...toPlayer,
                x: lerp(fromPlayer.x, toPlayer.x, t),
                y: lerp(fromPlayer.y, toPlayer.y, t),
                z: lerp(fromPlayer.z, toPlayer.z, t),
                yaw: lerpAngle(fromPlayer.yaw, toPlayer.yaw, t),
                flash_duration: lerp(fromPlayer.flash_duration, toPlayer.flash_duration, t),
            };
        }),
    };
}

/** Finds the two sampled frames bracketing `timeS` and interpolates between them (or clamps to the nearest one at the round's edges). */
function frameAt(frames: Frame[], timeS: number): Frame | null {
    if (frames.length === 0) return null;
    if (timeS <= frames[0].time_s) return frames[0];

    const lastFrame = frames[frames.length - 1];
    if (timeS >= lastFrame.time_s) return lastFrame;

    // Frames are already in tick order and there are at most a few
    // hundred per round at democompact's ~200ms sample rate — a linear
    // scan is plenty fast here, no need for a binary search.
    for (let i = 0; i < frames.length - 1; i++) {
        const a = frames[i];
        const b = frames[i + 1];
        if (timeS >= a.time_s && timeS <= b.time_s) {
            const span = b.time_s - a.time_s;
            return interpolateFrame(a, b, span > 0 ? (timeS - a.time_s) / span : 0);
        }
    }

    return lastFrame;
}

const THROTTLE_MS = 100;

export function useDemoPlayback(replay: DemoReplay | null): DemoPlaybackState & DemoPlaybackControls {
    const [roundIndex, setRoundIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [speed, setSpeedState] = useState<number>(1);
    const [timeS, setTimeS] = useState(0);
    const [players, setPlayers] = useState<PlayerFrame[]>([]);

    const round = replay?.rounds[roundIndex] ?? null;
    const durationS = round?.frames.at(-1)?.time_s ?? 0;

    // The actual playback clock the rAF loop advances — a ref, not
    // state, so 60fps updates never trigger a React re-render. `timeS`
    // (state, above) trails this at THROTTLE_MS for the slower UI.
    const liveTimeRef = useRef(0);
    const subscribersRef = useRef(new Set<(frame: Frame | null) => void>());

    // Returns the frame it computed so throttled call sites below can also
    // feed `players` state from it, without recomputing frameAt a second
    // time — the unthrottled per-rAF-tick call inside tick() just ignores
    // the return value.
    const publish = useCallback((atTimeS: number, forRound: Round | null): Frame | null => {
        const frame = forRound ? frameAt(forRound.frames, atTimeS) : null;
        subscribersRef.current.forEach((callback) => callback(frame));
        return frame;
    }, []);

    // The rAF loop itself. Re-anchors liveTimeRef to the latest
    // committed timeS every time it (re)starts — covers both "play was
    // just pressed" and "the round changed while already playing" (round
    // identity changing is what actually applies goToRound's timeS=0
    // reset to the clock this loop reads).
    useEffect(() => {
        liveTimeRef.current = timeS;

        if (!isPlaying || !round) return;

        let raf: number;
        let last = performance.now();
        let lastFlush = last;

        const tick = (now: number) => {
            const next = Math.min(durationS, liveTimeRef.current + ((now - last) / 1000) * speed);
            last = now;
            liveTimeRef.current = next;

            const frame = publish(next, round);

            if (now - lastFlush > THROTTLE_MS) {
                lastFlush = now;
                setTimeS(next);
                setPlayers(frame?.players ?? []);
            }

            if (next >= durationS) {
                setIsPlaying(false);
                setTimeS(next);
                setPlayers(frame?.players ?? []);
                return;
            }

            raf = requestAnimationFrame(tick);
        };

        raf = requestAnimationFrame(tick);

        return () => cancelAnimationFrame(raf);
        // eslint-disable-next-line react-hooks/exhaustive-deps -- timeS is deliberately not a dependency: seek()/goToRound() below write liveTimeRef directly and publish immediately, so this effect only needs to restart for play/pause/round/speed changes, not every seek.
    }, [isPlaying, round, speed, durationS, publish]);

    // Keeps subscribers in sync while paused (seek()/goToRound() below
    // already publish immediately when playing, but the initial mount —
    // isPlaying starts false — needs this to show frame 0 before Play is
    // ever pressed).
    useEffect(() => {
        if (isPlaying) return;
        liveTimeRef.current = timeS;
        const frame = publish(timeS, round);
        setPlayers(frame?.players ?? []);
    }, [isPlaying, timeS, round, publish]);

    const play = useCallback(() => setIsPlaying(true), []);

    const pause = useCallback(() => {
        // Commit the exact live position rather than waiting for the
        // next throttled flush, so pausing never visibly rewinds by up
        // to THROTTLE_MS.
        setTimeS(liveTimeRef.current);
        setIsPlaying(false);
    }, []);

    const togglePlay = useCallback(() => (isPlaying ? pause() : play()), [isPlaying, pause, play]);

    const seek = useCallback(
        (t: number) => {
            const clamped = Math.max(0, Math.min(durationS, t));
            liveTimeRef.current = clamped;
            setTimeS(clamped);
            const frame = publish(clamped, round);
            setPlayers(frame?.players ?? []);
        },
        [durationS, round, publish],
    );

    const setSpeed = useCallback((s: number) => setSpeedState(s), []);

    const goToRound = useCallback(
        (index: number) => {
            if (!replay || replay.rounds.length === 0) return;

            const clamped = Math.max(0, Math.min(replay.rounds.length - 1, index));
            const nextRoundData = replay.rounds[clamped];

            setRoundIndex(clamped);
            setTimeS(0);
            liveTimeRef.current = 0;
            const frame = publish(0, nextRoundData);
            setPlayers(frame?.players ?? []);
        },
        [replay, publish],
    );

    const nextRound = useCallback(() => goToRound(roundIndex + 1), [goToRound, roundIndex]);
    const prevRound = useCallback(() => goToRound(roundIndex - 1), [goToRound, roundIndex]);

    const subscribe = useCallback((callback: (frame: Frame | null) => void) => {
        subscribersRef.current.add(callback);
        return () => {
            subscribersRef.current.delete(callback);
        };
    }, []);

    return {
        roundIndex,
        round,
        isPlaying,
        speed,
        timeS,
        durationS,
        players,
        play,
        pause,
        togglePlay,
        seek,
        setSpeed,
        goToRound,
        nextRound,
        prevRound,
        subscribe,
    };
}
