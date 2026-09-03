import type { Meta, StoryObj } from '@storybook/react-vite';
import { useEffect, useRef } from 'react';

import { Text } from '../primitives/Text';
import { DemoKillFeed, type DemoKillFeedEntry } from './DemoKillFeed';
import { DemoRadar, type DemoRadarHandle } from './DemoRadar';
import { DemoRadarOverlay } from './DemoRadarOverlay';

const meta: Meta<typeof DemoRadarOverlay> = {
    title: 'Patterns/DemoRadarOverlay',
    component: DemoRadarOverlay,
    parameters: {
        docs: {
            description: {
                component:
                    'Meant to be composed inside a `relative` wrapper around DemoRadar — this story shows that composition with a kill feed, its main intended use.',
            },
        },
    },
};
export default meta;

type Story = StoryObj<typeof DemoRadarOverlay>;

const PLACEHOLDER_RADAR =
    'data:image/svg+xml;utf8,' +
    encodeURIComponent(`
        <svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024">
            <rect width="1024" height="1024" fill="#1a2230" />
        </svg>
    `);

const CALIBRATION = { radar_image: PLACEHOLDER_RADAR, pos_x: 0, pos_y: 1024, scale: 1 };

const KILLS: DemoKillFeedEntry[] = [
    { time_s: 10, killer_steam_id: '1', victim_steam_id: '2', weapon: 'ak47', headshot: true },
    { time_s: 8, killer_steam_id: '3', victim_steam_id: '4', weapon: 'awp', headshot: false },
];

const PLAYER_NAMES = { '1': 'ct_one', '2': 't_one', '3': 't_two', '4': 'ct_two' };

/** DemoRadarOverlay composed with DemoRadar and DemoKillFeed — the actual pairing show.tsx uses. */
export const OverKillFeed: Story = {
    render: () => {
        const ref = useRef<DemoRadarHandle>(null);

        useEffect(() => {
            ref.current?.draw({ tick: 0, time_s: 10, players: [] });
        }, []);

        return (
            <div className="relative max-w-md">
                <DemoRadar ref={ref} calibration={CALIBRATION} tickRate={64} />
                <DemoRadarOverlay>
                    <Text variant="muted" className="mb-2 text-xs tracking-wide uppercase">
                        Kills
                    </Text>
                    <DemoKillFeed kills={KILLS} currentTimeS={10} playerNames={PLAYER_NAMES} />
                </DemoRadarOverlay>
            </div>
        );
    },
};

export const AllCorners: Story = {
    render: () => (
        <div className="relative max-w-md">
            <DemoRadar calibration={CALIBRATION} tickRate={64} />
            <DemoRadarOverlay position="top-left">
                <Text variant="muted">top-left</Text>
            </DemoRadarOverlay>
            <DemoRadarOverlay position="top-right">
                <Text variant="muted">top-right</Text>
            </DemoRadarOverlay>
            <DemoRadarOverlay position="bottom-left">
                <Text variant="muted">bottom-left</Text>
            </DemoRadarOverlay>
            <DemoRadarOverlay position="bottom-right">
                <Text variant="muted">bottom-right</Text>
            </DemoRadarOverlay>
        </div>
    ),
};
