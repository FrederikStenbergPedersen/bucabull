import type { Meta, StoryObj } from '@storybook/react-vite';

import { EmptySlotCard } from './EmptySlotCard';

const meta: Meta<typeof EmptySlotCard> = {
    title: 'Patterns/EmptySlotCard',
    component: EmptySlotCard,
};
export default meta;

type Story = StoryObj<typeof EmptySlotCard>;

export const Default: Story = {};

export const CustomLabel: Story = {
    args: { label: 'No lineups yet for this map' },
};
