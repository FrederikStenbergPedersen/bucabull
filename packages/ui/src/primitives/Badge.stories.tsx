import type { Meta, StoryObj } from '@storybook/react-vite';

import { Badge } from './Badge';

const meta: Meta<typeof Badge> = {
    title: 'Primitives/Badge',
    component: Badge,
};
export default meta;

type Story = StoryObj<typeof Badge>;

export const Positive: Story = {
    args: { children: 'Online', tone: 'positive' },
};

export const Negative: Story = {
    args: { children: 'Offline', tone: 'negative' },
};

export const Info: Story = {
    args: { children: 'Faceit 9 · 2450', tone: 'info' },
};

export const Warning: Story = {
    args: { children: 'T', tone: 'warning' },
};

export const Neutral: Story = {
    args: { children: 'Faceit 8 · 1850', tone: 'neutral' },
};

export const Muted: Story = {
    args: { children: 'Snooze', tone: 'muted' },
};
