import type { Meta, StoryObj } from '@storybook/react-vite';

import { AmbientBackdrop } from './AmbientBackdrop';

const meta: Meta<typeof AmbientBackdrop> = {
    title: 'Patterns/AmbientBackdrop',
    component: AmbientBackdrop,
    decorators: [
        (Story) => (
            <div className="relative h-96 w-full overflow-hidden">
                <Story />
            </div>
        ),
    ],
};
export default meta;

type Story = StoryObj<typeof AmbientBackdrop>;

export const Default: Story = {};
