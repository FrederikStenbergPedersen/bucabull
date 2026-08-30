import type { Meta, StoryObj } from '@storybook/react-vite';

import { Button } from './Button';

const meta: Meta<typeof Button> = {
    title: 'Primitives/Button',
    component: Button,
};
export default meta;

type Story = StoryObj<typeof Button>;

export const Primary: Story = {
    args: { children: 'Log in', variant: 'primary' },
};

export const Secondary: Story = {
    args: { children: 'Log out', variant: 'secondary' },
};

export const Ghost: Story = {
    args: { children: 'Cancel', variant: 'ghost' },
};

export const Destructive: Story = {
    args: { children: 'Delete', variant: 'destructive' },
};

export const Disabled: Story = {
    args: { children: 'Processing…', disabled: true },
};
