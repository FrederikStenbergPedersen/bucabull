import type { Meta, StoryObj } from '@storybook/react-vite';

import { Input } from './Input';

const meta: Meta<typeof Input> = {
    title: 'Primitives/Input',
    component: Input,
};
export default meta;

type Story = StoryObj<typeof Input>;

export const Default: Story = {
    args: { placeholder: 'email@example.com', type: 'email' },
};

export const Disabled: Story = {
    args: { placeholder: 'Disabled', disabled: true },
};
