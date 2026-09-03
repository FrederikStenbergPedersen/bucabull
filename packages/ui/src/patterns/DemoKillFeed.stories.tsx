import type { Meta, StoryObj } from '@storybook/react-vite';

import { DemoKillFeed } from './DemoKillFeed';

const meta: Meta<typeof DemoKillFeed> = {
    title: 'Patterns/DemoKillFeed',
    component: DemoKillFeed,
};
export default meta;

type Story = StoryObj<typeof DemoKillFeed>;

const PLAYER_NAMES = { '1': 'ropz', '2': 'donk', '3': 'zywOo', '4': 'niko', '5': 'm0NESY' };

const KILLS = [
    { time_s: 12.4, killer_steam_id: '1', victim_steam_id: '3', weapon: 'ak47', headshot: true },
    { time_s: 24.1, killer_steam_id: '2', victim_steam_id: '4', weapon: 'awp', headshot: false },
    { time_s: 31.8, killer_steam_id: '5', victim_steam_id: '1', weapon: 'm4a4', headshot: false },
    { time_s: 40.2, killer_steam_id: null, victim_steam_id: '2', weapon: 'hegrenade', headshot: false },
];

export const Progressive: Story = {
    args: { kills: KILLS, currentTimeS: 25, playerNames: PLAYER_NAMES },
};

export const NoKillsYet: Story = {
    args: { kills: KILLS, currentTimeS: 5, playerNames: PLAYER_NAMES },
};

export const AllKills: Story = {
    args: { kills: KILLS, currentTimeS: 999, playerNames: PLAYER_NAMES },
};
