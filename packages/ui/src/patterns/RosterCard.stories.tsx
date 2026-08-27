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
    },
};

export const Offline: Story = {
    args: {
        name: 'Player Two',
        status: { label: 'Offline', tone: 'muted' },
        faceit: { level: 6, elo: 1620 },
        playtimeLabel: '2.1h · last 2 weeks',
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
