import type { Meta, StoryObj } from '@storybook/react-vite';

import { RemovableThumbnail } from './RemovableThumbnail';

const meta: Meta<typeof RemovableThumbnail> = {
    title: 'Patterns/RemovableThumbnail',
    component: RemovableThumbnail,
};
export default meta;

type Story = StoryObj<typeof RemovableThumbnail>;

export const Default: Story = {
    args: {
        src: 'https://placehold.co/200x200',
        onRemove: () => {},
    },
};
