import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';

import { cn } from '../lib/cn';
import { typography } from '../tokens/typography';

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
    /** Round-relative playback time — used to time how long a dead player's marker has been visible, see the `kills` prop. */
    time_s: number;
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

/** Just enough of a round's kill list to time the dead-player marker below — not the app's full KillEvent shape, see the DemoRadarGrenade precedent for why this stays package-local. */
export interface DemoRadarKill {
    time_s: number;
    victim_steam_id: string | null;
}

export interface DemoRadarHandle {
    /**
     * Draws one frame. Called imperatively (typically from a
     * requestAnimationFrame loop via useDemoPlayback's `subscribe`)
     * rather than through a reactive `frame` prop, so 60fps updates
     * never trigger a React re-render — DemoRadar itself holds no
     * playback state, it only remembers the last frame it drew so it can
     * redraw once the radar image finishes loading or the panel resizes.
     */
    draw: (frame: DemoRadarFrame | null) => void;
}

export interface DemoRadarProps {
    calibration: DemoRadarCalibration;
    /** The current round's full grenade list (static per round, unlike `frame` — visibility/trajectory progress is derived from each drawn frame's own `tick`). */
    grenades?: DemoRadarGrenade[];
    /** The current round's full kill list (static per round) — used only to time the dead-player marker below, see `deadPlayerVisibleS`. */
    kills?: DemoRadarKill[];
    /** The demo's tick rate (64 or 128, from DemoReplay.tick_rate) — converts the decorative grenade-VFX durations below into ticks, so they play at the same real-world speed regardless of the source demo's tick rate. */
    tickRate: number;
    /** How long a dead player's marker (red X + name) stays visible after death, in seconds. */
    deadPlayerVisibleS?: number;
    /** Max canvas backing-store size in device pixels — the element itself is always responsive (`w-full`, square), sized to its actual rendered size via ResizeObserver and sharpened for the viewer's devicePixelRatio. Defaults to 2x Valve's own standard radar texture size. */
    resolution?: number;
    className?: string;
}

export const DEFAULT_DEAD_PLAYER_VISIBLE_S = 6;

const DOT_RADIUS = 6;
const FACING_LENGTH = 16;
const TRAJECTORY_WIDTH = 1.5;

const FLASH_MAX_S = 3;
const FLASH_MIN_VISIBLE_S = 0.05;

const DEAD_X_SIZE = 7;
const DEAD_FADE_S = 1;

const NAME_FONT_SIZE = 11;
const NAME_OFFSET_Y = 4;
const NAME_MIN_COLLISION_DIST = 14;

const FLASHBANG_BURST_S = 0.35;
const HE_BURST_S = 0.3;
const DECOY_VISIBLE_S = 4;
const SMOKE_FADEIN_S = 1;
const EFFECT_FADEOUT_S = 0.5;

// The panel size a marker/name is drawn at "natural" size for — bigger
// panels scale markers up (and smaller ones down) within the clamp below,
// rather than drawing a fixed CSS-pixel size at every panel size.
const REFERENCE_CSS_SIZE = 512;
const MARKER_SCALE_MIN = 0.6;
const MARKER_SCALE_MAX = 1.8;

const MAX_BACKING_PX = 2048;

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

function grenadeColor(type: string): string {
    return GRENADE_COLORS[type] ?? GRENADE_COLORS.unknown;
}

/** Center → edge gradient stops for a lingering smoke/molotov/incendiary cloud, distinguishing the two by hue (grey vs. flame) and giving molotov a cheap deterministic flicker driven by `tick`, not wall-clock time, so it renders identically no matter how playback is scrubbed. */
function effectGradientColors(type: string, alpha: number, tick: number): [string, string] {
    if (type === 'smoke') {
        return [`rgba(225, 225, 225, ${0.6 * alpha})`, 'rgba(225, 225, 225, 0)'];
    }
    const flicker = 0.08 * Math.sin(tick * 0.5);
    const coreAlpha = Math.max(0, Math.min(1, 0.65 + flicker)) * alpha;
    return [`rgba(255, 200, 90, ${coreAlpha})`, 'rgba(255, 80, 20, 0)'];
}

/** 0→1→0 fade across [startTick, endTick], ramping in over `fadeInTicks` and out over `fadeOutTicks` (0 = no ramp on that side, e.g. molotov ignites instantly but still fades out). */
function fadeAlpha(tick: number, startTick: number, endTick: number, fadeInTicks: number, fadeOutTicks: number): number {
    if (tick < startTick || tick > endTick) return 0;
    const fadeIn = fadeInTicks > 0 ? Math.min(1, (tick - startTick) / fadeInTicks) : 1;
    const fadeOut = fadeOutTicks > 0 ? Math.min(1, (endTick - tick) / fadeOutTicks) : 1;
    return Math.min(fadeIn, fadeOut);
}

/** An expanding, fading ring — the shared shape behind the flashbang/HE/decoy "burst" VFX below. `progress` is 0 (just detonated) → 1 (fully expanded/faded). */
function drawBurst(ctx: CanvasRenderingContext2D, px: number, py: number, progress: number, color: string, maxRadius: number, lineWidth: number) {
    const clamped = Math.min(1, Math.max(0, progress));
    const radius = maxRadius * clamped;
    const alpha = 1 - clamped;
    if (alpha <= 0 || radius <= 0) return;

    ctx.globalAlpha = alpha;
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.beginPath();
    ctx.arc(px, py, radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
}

/** Outlined text (dark stroke, then a colored fill) so a name reads over arbitrary map art. Skips drawing (but not the caller's dot/X) if it would land within `collisionDist` of an already-placed label this frame, tracked via `placed`. */
function drawNameLabel(
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    color: string,
    fontPx: number,
    placed: { x: number; y: number }[],
    collisionDist: number,
) {
    for (const p of placed) {
        const dx = p.x - x;
        const dy = p.y - y;
        if (dx * dx + dy * dy < collisionDist * collisionDist) return;
    }
    placed.push({ x, y });

    ctx.font = `${fontPx}px ${typography.fontSans}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.strokeText(text, x, y);
    ctx.fillStyle = color;
    ctx.fillText(text, x, y);
}

/**
 * Top-down radar — the calibration's own projection
 * (pixel = (world - pos) / scale, Y flipped since world Y increases
 * north but canvas Y increases downward) plus per-player dots, facing
 * cones and name labels (colored by team via the `--team-ct`/`--team-t`
 * tokens, read from computed style so this stays theme-aware without the
 * canvas needing its own light/dark branching), a graduated flash-ring +
 * dot overlay, a fading red-X marker for recently-dead players, and
 * grenade trajectories + per-type detonation VFX.
 *
 * The canvas backing store is sized to the element's actual rendered CSS
 * size and devicePixelRatio via ResizeObserver (see the sizing effect
 * below) rather than a fixed resolution stretched by CSS, so it stays
 * crisp at any panel size/DPI; marker sizes scale with the panel too
 * (see `MARKER_SCALE_MIN`/`MAX`) rather than staying a fixed CSS-pixel
 * size regardless of how big the radar is displayed.
 *
 * The yaw-to-screen-angle math here hasn't been checked against a real
 * demo yet (see go/README.md's fixture-data gap) — verify facing cones
 * point the right way against a known replay before relying on it.
 */
export const DemoRadar = forwardRef<DemoRadarHandle, DemoRadarProps>(
    (
        {
            calibration,
            grenades = [],
            kills = [],
            tickRate,
            deadPlayerVisibleS = DEFAULT_DEAD_PLAYER_VISIBLE_S,
            resolution = MAX_BACKING_PX,
            className,
        },
        ref,
    ) => {
        const canvasRef = useRef<HTMLCanvasElement>(null);
        const imageRef = useRef<HTMLImageElement | null>(null);
        const lastFrameRef = useRef<DemoRadarFrame | null>(null);
        const colorsRef = useRef({ ct: '#5b8def', t: '#e0a83a', dead: '#e5484d' });
        const sizeRef = useRef({ cssSize: 0, backingSize: 0, markerScale: 1 });
        const drawRef = useRef<(frame: DemoRadarFrame | null) => void>(() => {});

        useEffect(() => {
            const canvas = canvasRef.current;
            if (!canvas) return;

            const styles = getComputedStyle(canvas);
            const ct = styles.getPropertyValue('--team-ct').trim();
            const t = styles.getPropertyValue('--team-t').trim();
            const dead = styles.getPropertyValue('--destructive').trim();
            colorsRef.current = {
                ct: ct || colorsRef.current.ct,
                t: t || colorsRef.current.t,
                dead: dead || colorsRef.current.dead,
            };
        }, []);

        // Sizes the canvas backing store to its actual rendered CSS size *
        // devicePixelRatio (capped at `resolution`), and derives the
        // marker-scale factor used by every draw constant below. Declared
        // before the image-loading and draw-closure effects so sizeRef is
        // already populated by the time either of those first calls a
        // draw — effects run in declaration order within one commit.
        useEffect(() => {
            const canvas = canvasRef.current;
            if (!canvas) return;

            const applySize = (cssSize: number) => {
                if (cssSize <= 0) return;
                const dpr = window.devicePixelRatio || 1;
                const backingSize = Math.min(Math.round(cssSize * dpr), resolution);
                const markerScale = Math.min(MARKER_SCALE_MAX, Math.max(MARKER_SCALE_MIN, cssSize / REFERENCE_CSS_SIZE));

                sizeRef.current = { cssSize, backingSize, markerScale };

                if (canvas.width !== backingSize || canvas.height !== backingSize) {
                    canvas.width = backingSize;
                    canvas.height = backingSize;
                }

                drawRef.current(lastFrameRef.current);
            };

            const observer = new ResizeObserver((entries) => {
                const entry = entries[0];
                if (entry) applySize(Math.round(entry.contentRect.width));
            });
            observer.observe(canvas);
            applySize(Math.round(canvas.getBoundingClientRect().width));

            return () => observer.disconnect();
        }, [resolution]);

        // Split from the draw-closure effect below so a radar-image swap
        // doesn't depend on (and isn't re-triggered by) grenades/kills
        // changing every round — this used to reload the image on every
        // round change since it shared an effect with round-scoped data.
        useEffect(() => {
            const img = new Image();
            img.onload = () => drawRef.current(lastFrameRef.current);
            img.src = calibration.radar_image;
            imageRef.current = img;

            drawRef.current(lastFrameRef.current);
        }, [calibration.radar_image]);

        useEffect(() => {
            const canvas = canvasRef.current;

            const project = (x: number, y: number, imgScaleX: number, imgScaleY: number): [number, number] => [
                ((x - calibration.pos_x) / calibration.scale) * imgScaleX,
                ((calibration.pos_y - y) / calibration.scale) * imgScaleY,
            ];

            const deathTimeByPlayer = new Map<string, number>();
            for (const k of kills) {
                if (k.victim_steam_id) deathTimeByPlayer.set(k.victim_steam_id, k.time_s);
            }

            const drawGrenades = (ctx: CanvasRenderingContext2D, tick: number, imgScaleX: number, imgScaleY: number, markerScale: number) => {
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
                            ctx.lineWidth = TRAJECTORY_WIDTH * markerScale;
                            ctx.beginPath();
                            flown.forEach((p, i) => {
                                const [px, py] = project(p.x, p.y, imgScaleX, imgScaleY);
                                if (i === 0) ctx.moveTo(px, py);
                                else ctx.lineTo(px, py);
                            });
                            ctx.stroke();
                        }
                    }

                    if (g.detonate_tick === null || !g.detonation || tick < g.detonate_tick) continue;

                    const [px, py] = project(g.detonation.x, g.detonation.y, imgScaleX, imgScaleY);
                    const elapsedTicks = tick - g.detonate_tick;
                    const dot = DOT_RADIUS * markerScale;

                    switch (g.type) {
                        case 'flashbang': {
                            const burstTicks = FLASHBANG_BURST_S * tickRate;
                            if (elapsedTicks > burstTicks) break;
                            const progress = elapsedTicks / burstTicks;
                            drawBurst(ctx, px, py, progress, 'rgba(255, 255, 255, 0.95)', dot * 5, 2 * markerScale);
                            drawBurst(ctx, px, py, progress * 0.85, 'rgba(255, 244, 168, 0.75)', dot * 7, 1.5 * markerScale);
                            break;
                        }
                        case 'hegrenade': {
                            const burstTicks = HE_BURST_S * tickRate;
                            if (elapsedTicks > burstTicks) break;
                            const progress = elapsedTicks / burstTicks;
                            ctx.globalAlpha = 1 - progress;
                            ctx.fillStyle = 'rgba(255, 110, 60, 0.85)';
                            ctx.beginPath();
                            ctx.arc(px, py, dot * 1.4 * (1 - progress), 0, Math.PI * 2);
                            ctx.fill();
                            ctx.globalAlpha = 1;
                            drawBurst(ctx, px, py, progress, 'rgba(255, 140, 60, 0.9)', dot * 6, 2 * markerScale);
                            break;
                        }
                        case 'decoy': {
                            // No real end boundary in the data for a decoy's
                            // ~15s gunfire-mimic lifetime — this is a
                            // frontend-owned decorative window, deliberately
                            // a lesser pulse than a real utility circle.
                            const visibleTicks = DECOY_VISIBLE_S * tickRate;
                            if (elapsedTicks > visibleTicks) break;
                            const pulseTicks = tickRate * 0.8;
                            const pulse = (elapsedTicks % pulseTicks) / pulseTicks;
                            drawBurst(ctx, px, py, pulse, color, dot * 3, 1.25 * markerScale);
                            break;
                        }
                        case 'smoke':
                        case 'molotov':
                        case 'incendiary': {
                            // Lingering effect — only these three have a
                            // real effect_radius, see the field's comment.
                            if (!g.effect_radius) break;
                            const endTick = g.effect_end_tick ?? g.detonate_tick;
                            if (tick > endTick) break;

                            const fadeInTicks = g.type === 'smoke' ? SMOKE_FADEIN_S * tickRate : 0;
                            const alpha = fadeAlpha(tick, g.detonate_tick, endTick, fadeInTicks, EFFECT_FADEOUT_S * tickRate);
                            if (alpha <= 0) break;

                            const radius = (g.effect_radius / calibration.scale) * imgScaleX;
                            const [inner, outer] = effectGradientColors(g.type, alpha, tick);
                            const gradient = ctx.createRadialGradient(px, py, 0, px, py, radius);
                            gradient.addColorStop(0, inner);
                            gradient.addColorStop(1, outer);

                            ctx.fillStyle = gradient;
                            ctx.beginPath();
                            ctx.arc(px, py, radius, 0, Math.PI * 2);
                            ctx.fill();
                            break;
                        }
                        default:
                            break;
                    }
                }
            };

            const doDraw = (frame: DemoRadarFrame | null) => {
                const ctx = canvas?.getContext('2d');
                if (!canvas || !ctx) return;

                const { cssSize, backingSize, markerScale } = sizeRef.current;
                if (cssSize <= 0 || backingSize <= 0) return;

                const deviceScale = backingSize / cssSize;
                ctx.setTransform(deviceScale, 0, 0, deviceScale, 0, 0);
                ctx.clearRect(0, 0, cssSize, cssSize);

                const img = imageRef.current;
                if (img?.complete && img.naturalWidth > 0) {
                    ctx.drawImage(img, 0, 0, cssSize, cssSize);
                }

                if (!frame) return;

                const imgScaleX = img?.naturalWidth ? cssSize / img.naturalWidth : 1;
                const imgScaleY = img?.naturalHeight ? cssSize / img.naturalHeight : 1;

                // Utility drawn under players, so a player dot is never
                // obscured by a smoke/molotov circle sitting on top of it.
                drawGrenades(ctx, frame.tick, imgScaleX, imgScaleY, markerScale);

                const placedLabels: { x: number; y: number }[] = [];
                const collisionDist = NAME_MIN_COLLISION_DIST * markerScale;

                for (const player of frame.players) {
                    const [px, py] = project(player.x, player.y, imgScaleX, imgScaleY);

                    if (!player.is_alive) {
                        const deathTimeS = deathTimeByPlayer.get(player.steam_id);
                        if (deathTimeS === undefined) continue; // disconnect or no matching kill — same as before, just skip

                        const elapsed = frame.time_s - deathTimeS;
                        if (elapsed < 0 || elapsed > deadPlayerVisibleS) continue;

                        const fadeStart = deadPlayerVisibleS - DEAD_FADE_S;
                        const alpha = elapsed > fadeStart ? Math.max(0, 1 - (elapsed - fadeStart) / DEAD_FADE_S) : 1;
                        const half = DEAD_X_SIZE * markerScale;

                        ctx.globalAlpha = alpha;
                        ctx.strokeStyle = colorsRef.current.dead;
                        ctx.lineWidth = 2.5 * markerScale;
                        ctx.beginPath();
                        ctx.moveTo(px - half, py - half);
                        ctx.lineTo(px + half, py + half);
                        ctx.moveTo(px + half, py - half);
                        ctx.lineTo(px - half, py + half);
                        ctx.stroke();

                        drawNameLabel(
                            ctx,
                            player.name,
                            px,
                            py - half - NAME_OFFSET_Y * markerScale,
                            colorsRef.current.dead,
                            NAME_FONT_SIZE * markerScale,
                            placedLabels,
                            collisionDist,
                        );
                        ctx.globalAlpha = 1;
                        continue;
                    }

                    const color = player.team === 'CT' ? colorsRef.current.ct : colorsRef.current.t;
                    const yawRad = (player.yaw * Math.PI) / 180;
                    const dotRadius = DOT_RADIUS * markerScale;
                    const facingLength = FACING_LENGTH * markerScale;
                    const flashT = Math.min(player.flash_duration, FLASH_MAX_S) / FLASH_MAX_S;

                    ctx.strokeStyle = color;
                    ctx.lineWidth = 2 * markerScale;
                    ctx.beginPath();
                    ctx.moveTo(px, py);
                    ctx.lineTo(px + Math.cos(yawRad) * facingLength, py - Math.sin(yawRad) * facingLength);
                    ctx.stroke();

                    // Flash ring: width/opacity scale continuously with
                    // flash_duration instead of a flat on/off ring, so
                    // "barely flashed" and "fully white-screened" read
                    // distinctly rather than identically.
                    if (player.flash_duration > FLASH_MIN_VISIBLE_S) {
                        ctx.globalAlpha = 0.35 + flashT * 0.65;
                        ctx.strokeStyle = '#ffffff';
                        ctx.lineWidth = (1.5 + flashT * 3) * markerScale;
                        ctx.beginPath();
                        ctx.arc(px, py, dotRadius + 3 * markerScale, 0, Math.PI * 2);
                        ctx.stroke();
                        ctx.globalAlpha = 1;
                    }

                    ctx.fillStyle = color;
                    ctx.beginPath();
                    ctx.arc(px, py, dotRadius, 0, Math.PI * 2);
                    ctx.fill();

                    // Near-fully-flashed also gets a soft white overlay on
                    // the dot itself, on top of the team color — otherwise
                    // even a near-max ring can read as "just team-colored
                    // plus a thin ring" rather than unmistakably blind.
                    if (flashT > 0.66) {
                        ctx.globalAlpha = ((flashT - 0.66) / 0.34) * 0.6;
                        ctx.fillStyle = '#ffffff';
                        ctx.beginPath();
                        ctx.arc(px, py, dotRadius * 0.7, 0, Math.PI * 2);
                        ctx.fill();
                        ctx.globalAlpha = 1;
                    }

                    drawNameLabel(
                        ctx,
                        player.name,
                        px,
                        py - dotRadius - NAME_OFFSET_Y * markerScale,
                        color,
                        NAME_FONT_SIZE * markerScale,
                        placedLabels,
                        collisionDist,
                    );
                }
            };

            drawRef.current = (frame) => {
                lastFrameRef.current = frame;
                doDraw(frame);
            };

            doDraw(lastFrameRef.current);
        }, [calibration, grenades, kills, tickRate, deadPlayerVisibleS]);

        useImperativeHandle(ref, () => ({ draw: (frame) => drawRef.current(frame) }), []);

        return (
            <canvas
                ref={canvasRef}
                width={1024}
                height={1024}
                className={cn('border-border bg-muted aspect-square w-full rounded-md border', className)}
            />
        );
    },
);
DemoRadar.displayName = 'DemoRadar';
