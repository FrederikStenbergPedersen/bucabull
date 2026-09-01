import type { Meta, StoryObj } from '@storybook/react-vite';

import { MatchCard } from './MatchCard';

const meta: Meta<typeof MatchCard> = {
    title: 'Patterns/MatchCard',
    component: MatchCard,
};
export default meta;

type Story = StoryObj<typeof MatchCard>;

export const Win: Story = {
    args: {
        map: 'de_mirage',
        mapOverview: '/maps/mirage.webp',
        result: { label: 'Win', tone: 'positive' },
        score: '13 / 9',
        kdLabel: '24 / 14 / 3',
        playedAtLabel: '2 hours ago',
    },
};

export const Loss: Story = {
    args: {
        map: 'de_ancient',
        mapOverview: '/maps/ancient.webp',
        result: { label: 'Loss', tone: 'negative' },
        score: '10 / 13',
        kdLabel: '15 / 19 / 5',
        playedAtLabel: '1 day ago',
    },
};

export const NoOverview: Story = {
    name: 'Unrecognized custom map (no overview)',
    args: {
        map: 'Some Workshop Map',
        mapOverview: null,
        result: { label: 'Win', tone: 'positive' },
        score: '13 / 11',
        kdLabel: '18 / 16 / 2',
        playedAtLabel: '3 days ago',
    },
};
