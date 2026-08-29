import type { Meta, StoryObj } from '@storybook/react-vite';

import { JoinCta } from './JoinCta';

const meta: Meta<typeof JoinCta> = {
    title: 'Patterns/JoinCta',
    component: JoinCta,
};
export default meta;

type Story = StoryObj<typeof JoinCta>;

export const Default: Story = {
    args: {
        href: '#',
    },
};
