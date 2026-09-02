import type { Meta, StoryObj } from '@storybook/react-vite';
import { useEffect, useRef } from 'react';

import { DemoRadar, type DemoRadarHandle } from './DemoRadar';

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
// to match DemoRadar's default resolution, so the placeholder calibration
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

export const Static: Story = {
    render: () => {
        const ref = useRef<DemoRadarHandle>(null);

        useEffect(() => {
            ref.current?.draw({
                tick: 0,
                players: [
                    { steam_id: '1', name: 'ct_one', team: 'CT', x: 300, y: 700, yaw: 90, is_alive: true, flash_duration: 0 },
                    { steam_id: '2', name: 'ct_two', team: 'CT', x: 380, y: 650, yaw: 45, is_alive: true, flash_duration: 0.8 },
                    { steam_id: '3', name: 't_one', team: 'T', x: 700, y: 300, yaw: 270, is_alive: true, flash_duration: 0 },
                    { steam_id: '4', name: 't_two', team: 'T', x: 640, y: 380, yaw: 200, is_alive: false, flash_duration: 0 },
                ],
            });
        }, []);

        return <DemoRadar ref={ref} calibration={CALIBRATION} className="max-w-md" />;
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

                ref.current?.draw({ tick: Math.round(t / 15.625), players }); // ~64 ticks/sec, matching a real 64-tick demo's cadence

                raf = requestAnimationFrame(tick);
            };

            raf = requestAnimationFrame(tick);
            return () => cancelAnimationFrame(raf);
        }, []);

        return <DemoRadar ref={ref} calibration={CALIBRATION} className="max-w-md" />;
    },
};

/**
 * A smoke and a molotov thrown from spawn, animated: trajectory arcs
 * reveal progressively as `tick` advances through each grenade's flight,
 * then the smoke/molotov circle appears at detonation and disappears at
 * effect_end_tick — the same data shape (and the same DemoRadar props)
 * a real round's `grenades` array provides.
 */
export const Utility: Story = {
    render: () => {
        const ref = useRef<DemoRadarHandle>(null);

        const grenades = [
            {
                type: 'smoke',
                throw_tick: 0,
                detonate_tick: 80,
                trajectory: Array.from({ length: 9 }, (_, i) => ({ tick: i * 10, x: 200 + i * 50, y: 850 - i * 60 })),
                detonation: { x: 600, y: 320 },
                effect_radius: 144,
                effect_end_tick: 400,
            },
            {
                type: 'molotov',
                throw_tick: 20,
                detonate_tick: 90,
                trajectory: Array.from({ length: 8 }, (_, i) => ({ tick: 20 + i * 10, x: 850 - i * 40, y: 850 - i * 70 })),
                detonation: { x: 560, y: 290 },
                effect_radius: 160,
                effect_end_tick: 300,
            },
        ];

        useEffect(() => {
            let raf: number;
            const start = performance.now();

            const draw = (now: number) => {
                const tick = Math.round(((now - start) / 1000) * 64) % 500;
                ref.current?.draw({ tick, players: [] });
                raf = requestAnimationFrame(draw);
            };

            raf = requestAnimationFrame(draw);
            return () => cancelAnimationFrame(raf);
        }, []);

        return <DemoRadar ref={ref} calibration={CALIBRATION} grenades={grenades} className="max-w-md" />;
    },
};

export const NoFrameYet: Story = {
    render: () => {
        const ref = useRef<DemoRadarHandle>(null);
        return <DemoRadar ref={ref} calibration={CALIBRATION} className="max-w-md" />;
    },
};
