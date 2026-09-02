import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';

import { cn } from '../lib/cn';

export interface DemoRadarCalibration {
    radar_image: string;
    pos_x: number;
    pos_y: number;
    scale: number;
}

export interface DemoRadarPlayer {
    steam_id: string;
    name: string;
    team: 'CT' | 'T' | '';
    x: number;
    y: number;
    /** View yaw in degrees — 0 = facing world +X, increasing counter-clockwise (Source engine's convention). */
    yaw: number;
    is_alive: boolean;
    flash_duration: number;
}

export interface DemoRadarFrame {
    /** Demo-tick of this (possibly interpolated) frame — drives which grenades are mid-flight/active, see the `grenades` prop. */
    tick: number;
    players: DemoRadarPlayer[];
}

export interface DemoRadarTrajectoryPoint {
    tick: number;
    x: number;
    y: number;
}

export interface DemoRadarGrenade {
    type: string; // smoke | flashbang | molotov | incendiary | hegrenade | decoy | unknown — see the Go schema
    throw_tick: number;
    detonate_tick: number | null;
    trajectory: DemoRadarTrajectoryPoint[];
    detonation: { x: number; y: number } | null;
    /** Only smoke/molotov/incendiary have one — see the Grenade.EffectRadius comment in go/internal/parse/schema.go. */
    effect_radius: number | null;
    effect_end_tick: number | null;
}

export interface DemoRadarHandle {
    /**
     * Draws one frame. Called imperatively (typically from a
     * requestAnimationFrame loop via useDemoPlayback's `subscribe`)
     * rather than through a reactive `frame` prop, so 60fps updates
     * never trigger a React re-render — DemoRadar itself holds no
     * playback state, it only remembers the last frame it drew so it can
     * redraw once the radar image finishes loading.
     */
    draw: (frame: DemoRadarFrame | null) => void;
}

export interface DemoRadarProps {
    calibration: DemoRadarCalibration;
    /** The current round's full grenade list (static per round, unlike `frame` — visibility/trajectory progress is derived from each drawn frame's own `tick`). */
    grenades?: DemoRadarGrenade[];
    /** Internal drawing-buffer size in pixels — the element itself is always responsive (`w-full`, square). Defaults to Valve's own standard radar texture size. */
    resolution?: number;
    className?: string;
}

const DOT_RADIUS = 6;
const FACING_LENGTH = 16;
const FLASH_RING_THRESHOLD_S = 0.3;
const TRAJECTORY_WIDTH = 1.5;

// Not design tokens (tokens/colors.ts): these are one-off canvas
// iconography for a single component, not colors used anywhere else in
// the UI — see DOT colors above for the contrast, which ARE tokens
// because they need to mean the same thing (CT/T) wherever they appear.
const GRENADE_COLORS: Record<string, string> = {
    smoke: 'rgba(220, 220, 220, 0.9)',
    flashbang: 'rgba(255, 244, 168, 0.9)',
    molotov: 'rgba(255, 120, 40, 0.9)',
    incendiary: 'rgba(255, 120, 40, 0.9)',
    hegrenade: 'rgba(255, 90, 90, 0.9)',
    decoy: 'rgba(180, 180, 180, 0.9)',
    unknown: 'rgba(200, 200, 200, 0.9)',
};

const EFFECT_FILL: Record<string, string> = {
    smoke: 'rgba(210, 210, 210, 0.35)',
    molotov: 'rgba(255, 100, 20, 0.3)',
    incendiary: 'rgba(255, 100, 20, 0.3)',
};

function grenadeColor(type: string): string {
    return GRENADE_COLORS[type] ?? GRENADE_COLORS.unknown;
}

/**
 * Top-down radar — the calibration's own projection
 * (pixel = (world - pos) / scale, Y flipped since world Y increases
 * north but canvas Y increases downward) plus per-player dots and
 * facing cones (colored by team via the `--team-ct`/`--team-t` tokens,
 * read from computed style so this stays theme-aware without the canvas
 * needing its own light/dark branching), and grenade trajectories +
 * smoke/molotov/incendiary effect circles.
 *
 * The yaw-to-screen-angle math here hasn't been checked against a real
 * demo yet (see go/README.md's fixture-data gap) — verify facing cones
 * point the right way against a known replay before relying on it.
 */
export const DemoRadar = forwardRef<DemoRadarHandle, DemoRadarProps>(({ calibration, grenades = [], resolution = 1024, className }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const imageRef = useRef<HTMLImageElement | null>(null);
    const lastFrameRef = useRef<DemoRadarFrame | null>(null);
    const colorsRef = useRef({ ct: '#5b8def', t: '#e0a83a' });

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const styles = getComputedStyle(canvas);
        const ct = styles.getPropertyValue('--team-ct').trim();
        const t = styles.getPropertyValue('--team-t').trim();
        colorsRef.current = { ct: ct || colorsRef.current.ct, t: t || colorsRef.current.t };
    }, []);

    const drawRef = useRef<(frame: DemoRadarFrame | null) => void>(() => {});

    useEffect(() => {
        const canvas = canvasRef.current;

        const project = (x: number, y: number, imgScaleX: number, imgScaleY: number): [number, number] => [
            ((x - calibration.pos_x) / calibration.scale) * imgScaleX,
            ((calibration.pos_y - y) / calibration.scale) * imgScaleY,
        ];

        const drawGrenades = (ctx: CanvasRenderingContext2D, tick: number, imgScaleX: number, imgScaleY: number) => {
            for (const g of grenades) {
                if (tick < g.throw_tick) continue;

                const color = grenadeColor(g.type);
                const flightEndTick = g.detonate_tick ?? tick;

                // Trajectory: the portion flown by `tick` — the full
                // array is already known (captured all at once when the
                // grenade landed), this just reveals it progressively.
                if (tick <= flightEndTick && g.trajectory.length > 1) {
                    const flown = g.trajectory.filter((p) => p.tick <= tick);
                    if (flown.length > 1) {
                        ctx.strokeStyle = color;
                        ctx.lineWidth = TRAJECTORY_WIDTH;
                        ctx.beginPath();
                        flown.forEach((p, i) => {
                            const [px, py] = project(p.x, p.y, imgScaleX, imgScaleY);
                            if (i === 0) ctx.moveTo(px, py);
                            else ctx.lineTo(px, py);
                        });
                        ctx.stroke();
                    }
                }

                // Lingering effect (smoke/molotov/incendiary only — see
                // the effect_radius field comment).
                if (
                    g.detonation &&
                    g.effect_radius &&
                    g.detonate_tick !== null &&
                    tick >= g.detonate_tick &&
                    tick <= (g.effect_end_tick ?? g.detonate_tick)
                ) {
                    const [px, py] = project(g.detonation.x, g.detonation.y, imgScaleX, imgScaleY);
                    const radius = (g.effect_radius / calibration.scale) * imgScaleX;

                    ctx.fillStyle = EFFECT_FILL[g.type] ?? 'rgba(200, 200, 200, 0.3)';
                    ctx.beginPath();
                    ctx.arc(px, py, radius, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        };

        const doDraw = (frame: DemoRadarFrame | null) => {
            const ctx = canvas?.getContext('2d');
            if (!canvas || !ctx) return;

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const img = imageRef.current;
            if (img?.complete && img.naturalWidth > 0) {
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            }

            if (!frame) return;

            const imgScaleX = img?.naturalWidth ? canvas.width / img.naturalWidth : 1;
            const imgScaleY = img?.naturalHeight ? canvas.height / img.naturalHeight : 1;

            // Utility drawn under players, so a player dot is never
            // obscured by a smoke/molotov circle sitting on top of it.
            drawGrenades(ctx, frame.tick, imgScaleX, imgScaleY);

            for (const player of frame.players) {
                if (!player.is_alive) continue;

                const [px, py] = project(player.x, player.y, imgScaleX, imgScaleY);
                const color = player.team === 'CT' ? colorsRef.current.ct : colorsRef.current.t;
                const yawRad = (player.yaw * Math.PI) / 180;

                ctx.strokeStyle = color;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(px, py);
                ctx.lineTo(px + Math.cos(yawRad) * FACING_LENGTH, py - Math.sin(yawRad) * FACING_LENGTH);
                ctx.stroke();

                ctx.fillStyle = color;
                ctx.beginPath();
                ctx.arc(px, py, DOT_RADIUS, 0, Math.PI * 2);
                ctx.fill();

                if (player.flash_duration > FLASH_RING_THRESHOLD_S) {
                    ctx.strokeStyle = '#ffffff';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.arc(px, py, DOT_RADIUS + 3, 0, Math.PI * 2);
                    ctx.stroke();
                }
            }
        };

        drawRef.current = (frame) => {
            lastFrameRef.current = frame;
            doDraw(frame);
        };

        // Draw whatever we last had as soon as the image is ready,
        // rather than waiting for the next playback frame to happen to
        // call draw() again — otherwise a slow-loading radar image can
        // leave the canvas blank for a beat after mount/map change.
        const img = new Image();
        img.onload = () => doDraw(lastFrameRef.current);
        img.src = calibration.radar_image;
        imageRef.current = img;

        doDraw(lastFrameRef.current);
    }, [calibration, grenades]);

    useImperativeHandle(ref, () => ({ draw: (frame) => drawRef.current(frame) }), []);

    return (
        <canvas
            ref={canvasRef}
            width={resolution}
            height={resolution}
            className={cn('border-border bg-muted aspect-square w-full rounded-md border', className)}
        />
    );
});
DemoRadar.displayName = 'DemoRadar';
