import type { Meta, StoryObj } from '@storybook/react-vite';

import { Select } from './Select';

const meta: Meta<typeof Select> = {
    title: 'Primitives/Select',
    component: Select,
};
export default meta;

type Story = StoryObj<typeof Select>;

export const Default: Story = {
    args: {
        children: (
            <>
                <option value="mirage">Mirage</option>
                <option value="inferno">Inferno</option>
                <option value="other">Other...</option>
            </>
        ),
    },
};
