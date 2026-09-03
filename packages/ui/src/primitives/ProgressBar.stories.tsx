import type { Meta, StoryObj } from '@storybook/react-vite';

import { ProgressBar } from './ProgressBar';

const meta: Meta<typeof ProgressBar> = {
    title: 'Primitives/ProgressBar',
    component: ProgressBar,
};
export default meta;

type Story = StoryObj<typeof ProgressBar>;

export const Empty: Story = { args: { value: 0 } };
export const Midway: Story = { args: { value: 42 } };
export const Complete: Story = { args: { value: 100 } };
