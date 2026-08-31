import type { Meta, StoryObj } from '@storybook/react-vite';

import { RosterCard } from './RosterCard';

const meta: Meta<typeof RosterCard> = {
    title: 'Patterns/RosterCard',
    component: RosterCard,
};
export default meta;

type Story = StoryObj<typeof RosterCard>;

export const Online: Story = {
    args: {
        name: 'Player One',
        status: { label: 'Online', tone: 'positive' },
        faceit: { level: 9, elo: 2450 },
        playtimeLabel: '18.5h · last 2 weeks',
        lifetimeStatsLabel: '58% WR · 612 matches · 1.12 avg K/D',
    },
};

export const Offline: Story = {
    args: {
        name: 'Player Two',
        status: { label: 'Offline', tone: 'muted' },
        faceit: { level: 6, elo: 1620 },
        playtimeLabel: '2.1h · last 2 weeks',
        lifetimeStatsLabel: '49% WR · 288 matches · 0.94 avg K/D',
    },
};

export const NoFaceitData: Story = {
    args: {
        name: 'Player Three',
        status: { label: 'Away', tone: 'neutral' },
        faceit: null,
        playtimeLabel: null,
    },
};

export const Linked: Story = {
    args: {
        name: 'Player Four',
        status: { label: 'Online', tone: 'positive' },
        faceit: { level: 8, elo: 2100 },
        playtimeLabel: '9.2h · last 2 weeks',
        href: '#',
    },
};
