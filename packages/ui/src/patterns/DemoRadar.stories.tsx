import type { Meta, StoryObj } from '@storybook/react-vite';
import { useEffect, useRef } from 'react';

import { DemoRadar, type DemoRadarHandle, type DemoRadarKill } from './DemoRadar';

const meta: Meta<typeof DemoRadar> = {
    title: 'Patterns/DemoRadar',
    component: DemoRadar,
    parameters: {
        docs: {
            description: {
                component:
                    "No real radar art is bundled in this library (see config/map_radar.php's placeholder-data comment) — these stories use a small inline SVG grid as a stand-in background so the component is demonstrable without a real Valve asset.",
            },
        },
    },
};
export default meta;

type Story = StoryObj<typeof DemoRadar>;

// A neutral placeholder "radar" — a plain grid, not real map art. 1024x1024
// to match DemoRadar's native texture size, so the placeholder calibration
// below (pos_x/pos_y=0, scale mapping the whole 1024-unit square 1:1)
// lines up with it.
const PLACEHOLDER_RADAR =
    'data:image/svg+xml;utf8,' +
    encodeURIComponent(`
        <svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024">
            <rect width="1024" height="1024" fill="#1a2230" />
            ${Array.from({ length: 8 }, (_, i) => (i + 1) * 128)
                .map((p) => `<line x1="${p}" y1="0" x2="${p}" y2="1024" stroke="#2a3548" stroke-width="2" />`)
                .join('')}
            ${Array.from({ length: 8 }, (_, i) => (i + 1) * 128)
                .map((p) => `<line x1="0" y1="${p}" x2="1024" y2="${p}" stroke="#2a3548" stroke-width="2" />`)
                .join('')}
        </svg>
    `);

const CALIBRATION = { radar_image: PLACEHOLDER_RADAR, pos_x: 0, pos_y: 1024, scale: 1 };

// A real 64-tick demo's cadence — used wherever a story fabricates ticks
// from wall-clock time.
const TICK_RATE = 64;

export const Static: Story = {
    render: () => {
        const ref = useRef<DemoRadarHandle>(null);

        useEffect(() => {
            ref.current?.draw({
                tick: 0,
                time_s: 0,
                players: [
                    { steam_id: '1', name: 'ct_one', team: 'CT', x: 300, y: 700, yaw: 90, is_alive: true, flash_duration: 0 },
                    { steam_id: '2', name: 'ct_two', team: 'CT', x: 380, y: 650, yaw: 45, is_alive: true, flash_duration: 0.8 },
                    { steam_id: '3', name: 't_one', team: 'T', x: 700, y: 300, yaw: 270, is_alive: true, flash_duration: 0 },
                    { steam_id: '4', name: 't_two', team: 'T', x: 640, y: 380, yaw: 200, is_alive: false, flash_duration: 0 },
                ],
            });
        }, []);

        return <DemoRadar ref={ref} calibration={CALIBRATION} tickRate={TICK_RATE} className="max-w-md" />;
    },
};

/** Ten players orbiting the center — exercises the same imperative draw() path a real playback loop uses, at a real animation frame rate. */
export const Animated: Story = {
    render: () => {
        const ref = useRef<DemoRadarHandle>(null);

        useEffect(() => {
            let raf: number;

            const tick = (t: number) => {
                const players = Array.from({ length: 10 }, (_, i) => {
                    const angle = (t / 1000) * 0.5 + (i / 10) * Math.PI * 2;
                    const radius = 300;
                    return {
                        steam_id: String(i),
                        name: `player_${i}`,
                        team: (i < 5 ? 'CT' : 'T') as 'CT' | 'T',
                        x: 512 + Math.cos(angle) * radius,
                        y: 512 + Math.sin(angle) * radius,
                        yaw: (angle * 180) / Math.PI,
                        is_alive: true,
                        flash_duration: 0,
                    };
                });

                ref.current?.draw({ tick: Math.round(t / 15.625), time_s: t / 1000, players }); // ~64 ticks/sec, matching TICK_RATE

                raf = requestAnimationFrame(tick);
            };

            raf = requestAnimationFrame(tick);
            return () => cancelAnimationFrame(raf);
        }, []);

        return <DemoRadar ref={ref} calibration={CALIBRATION} tickRate={TICK_RATE} className="max-w-md" />;
    },
};

/**
 * A flashbang, HE grenade, decoy, smoke and molotov all thrown from
 * spawn, animated: trajectory arcs reveal progressively as `tick`
 * advances through each grenade's flight, then each type's own
 * detonation VFX plays — the same data shape (and the same DemoRadar
 * props) a real round's `grenades` array provides.
 */
export const Utility: Story = {
    render: () => {
        const ref = useRef<DemoRadarHandle>(null);

        const grenades = [
            {
                type: 'smoke',
                throw_tick: 0,
                detonate_tick: 80,
                trajectory: Array.from({ length: 9 }, (_, i) => ({ tick: i * 10, x: 150 + i * 40, y: 900 - i * 50 })),
                detonation: { x: 470, y: 500 },
                effect_radius: 144,
                effect_end_tick: 400,
            },
            {
                type: 'molotov',
                throw_tick: 20,
                detonate_tick: 90,
                trajectory: Array.from({ length: 8 }, (_, i) => ({ tick: 20 + i * 10, x: 900 - i * 30, y: 900 - i * 55 })),
                detonation: { x: 680, y: 530 },
                effect_radius: 160,
                effect_end_tick: 300,
            },
            {
                type: 'flashbang',
                throw_tick: 10,
                detonate_tick: 70,
                trajectory: Array.from({ length: 7 }, (_, i) => ({ tick: 10 + i * 10, x: 200 + i * 45, y: 300 + i * 30 })),
                detonation: { x: 470, y: 480 },
                effect_radius: null,
                effect_end_tick: null,
            },
            {
                type: 'hegrenade',
                throw_tick: 40,
                detonate_tick: 100,
                trajectory: Array.from({ length: 6 }, (_, i) => ({ tick: 40 + i * 10, x: 850 - i * 35, y: 250 + i * 20 })),
                detonation: { x: 680, y: 350 },
                effect_radius: null,
                effect_end_tick: null,
            },
            {
                type: 'decoy',
                throw_tick: 5,
                detonate_tick: 60,
                trajectory: Array.from({ length: 5 }, (_, i) => ({ tick: 5 + i * 10, x: 550, y: 850 - i * 60 })),
                detonation: { x: 550, y: 620 },
                effect_radius: null,
                effect_end_tick: null,
            },
        ];

        useEffect(() => {
            let raf: number;
            const start = performance.now();

            const draw = (now: number) => {
                const tick = Math.round(((now - start) / 1000) * TICK_RATE) % 500;
                ref.current?.draw({ tick, time_s: tick / TICK_RATE, players: [] });
                raf = requestAnimationFrame(draw);
            };

            raf = requestAnimationFrame(draw);
            return () => cancelAnimationFrame(raf);
        }, []);

        return <DemoRadar ref={ref} calibration={CALIBRATION} grenades={grenades} tickRate={TICK_RATE} className="max-w-md" />;
    },
};

/** Players at graduated flash_duration values — confirms the ring width/opacity and the on-dot white overlay scale distinctly at each step, rather than a flat on/off ring. */
export const Flashed: Story = {
    render: () => {
        const ref = useRef<DemoRadarHandle>(null);

        useEffect(() => {
            const durations = [0.1, 1, 2, 3];
            ref.current?.draw({
                tick: 0,
                time_s: 0,
                players: durations.map((flash_duration, i) => ({
                    steam_id: String(i),
                    name: `flash_${flash_duration}s`,
                    team: 'CT' as const,
                    x: 250 + i * 180,
                    y: 512,
                    yaw: 90,
                    is_alive: true,
                    flash_duration,
                })),
            });
        }, []);

        return <DemoRadar ref={ref} calibration={CALIBRATION} tickRate={TICK_RATE} className="max-w-md" />;
    },
};

/** Dead players at a fresh death, mid-fade, and just past the visible window — confirms the red-X marker, its fade-out, and the hard cutoff at `deadPlayerVisibleS`. Uses a short 3s window (vs. the real 6s default) so the story is legible without waiting. */
export const DeadPlayers: Story = {
    render: () => {
        const ref = useRef<DemoRadarHandle>(null);
        const visibleS = 3;

        const kills: DemoRadarKill[] = [
            { time_s: 10, victim_steam_id: 'fresh' }, // elapsed 0s
            { time_s: 8, victim_steam_id: 'mid' }, // elapsed 2s — inside the last-1s fade
            { time_s: 6.5, victim_steam_id: 'expired' }, // elapsed 3.5s — past the window, shouldn't render
        ];

        useEffect(() => {
            ref.current?.draw({
                tick: 640,
                time_s: 10,
                players: [
                    { steam_id: 'fresh', name: 'fresh_kill', team: 'CT', x: 280, y: 512, yaw: 0, is_alive: false, flash_duration: 0 },
                    { steam_id: 'mid', name: 'mid_fade', team: 'T', x: 512, y: 512, yaw: 0, is_alive: false, flash_duration: 0 },
                    { steam_id: 'expired', name: 'should_be_gone', team: 'T', x: 750, y: 512, yaw: 0, is_alive: false, flash_duration: 0 },
                    { steam_id: 'alive', name: 'still_alive', team: 'CT', x: 512, y: 300, yaw: 90, is_alive: true, flash_duration: 0 },
                ],
            });
        }, []);

        return (
            <DemoRadar ref={ref} calibration={CALIBRATION} kills={kills} tickRate={TICK_RATE} deadPlayerVisibleS={visibleS} className="max-w-md" />
        );
    },
};

/** Several players clustered tightly together — confirms the name-collision skip lets overlapping labels drop out (dot stays) rather than rendering unreadable overlapping text. */
export const CrowdedNames: Story = {
    render: () => {
        const ref = useRef<DemoRadarHandle>(null);

        useEffect(() => {
            ref.current?.draw({
                tick: 0,
                time_s: 0,
                players: Array.from({ length: 5 }, (_, i) => ({
                    steam_id: String(i),
                    name: `crowded_player_${i}`,
                    team: 'CT' as const,
                    x: 480 + i * 14,
                    y: 512 + (i % 2) * 10,
                    yaw: 90,
                    is_alive: true,
                    flash_duration: 0,
                })),
            });
        }, []);

        return <DemoRadar ref={ref} calibration={CALIBRATION} tickRate={TICK_RATE} className="max-w-md" />;
    },
};

/** The same animated scene rendered at two different container widths — confirms the canvas stays crisp (devicePixelRatio-aware backing store) and markers/names scale with panel size instead of staying a fixed CSS-pixel size. */
export const ResponsiveSizing: Story = {
    render: () => {
        const smallRef = useRef<DemoRadarHandle>(null);
        const largeRef = useRef<DemoRadarHandle>(null);

        useEffect(() => {
            let raf: number;

            const tick = (t: number) => {
                const players = Array.from({ length: 6 }, (_, i) => {
                    const angle = (t / 1000) * 0.5 + (i / 6) * Math.PI * 2;
                    const radius = 300;
                    return {
                        steam_id: String(i),
                        name: `player_${i}`,
                        team: (i < 3 ? 'CT' : 'T') as 'CT' | 'T',
                        x: 512 + Math.cos(angle) * radius,
                        y: 512 + Math.sin(angle) * radius,
                        yaw: (angle * 180) / Math.PI,
                        is_alive: true,
                        flash_duration: 0,
                    };
                });

                const frame = { tick: Math.round(t / 15.625), time_s: t / 1000, players };
                smallRef.current?.draw(frame);
                largeRef.current?.draw(frame);

                raf = requestAnimationFrame(tick);
            };

            raf = requestAnimationFrame(tick);
            return () => cancelAnimationFrame(raf);
        }, []);

        return (
            <div className="flex flex-wrap items-start gap-6">
                <DemoRadar ref={smallRef} calibration={CALIBRATION} tickRate={TICK_RATE} className="max-w-xs" />
                <DemoRadar ref={largeRef} calibration={CALIBRATION} tickRate={TICK_RATE} className="max-w-2xl" />
            </div>
        );
    },
};

export const NoFrameYet: Story = {
    render: () => {
        const ref = useRef<DemoRadarHandle>(null);
        return <DemoRadar ref={ref} calibration={CALIBRATION} tickRate={TICK_RATE} className="max-w-md" />;
    },
};
