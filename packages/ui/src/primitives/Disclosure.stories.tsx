import type { Meta, StoryObj } from '@storybook/react-vite';

import { Card } from './Card';
import { Disclosure } from './Disclosure';
import { Text } from './Text';

const meta: Meta<typeof Disclosure> = {
    title: 'Primitives/Disclosure',
    component: Disclosure,
};
export default meta;

type Story = StoryObj<typeof Disclosure>;

export const Open: Story = {
    args: {
        title: 'Smoke (12)',
        defaultOpen: true,
        children: (
            <Card>
                <Text variant="body">Contents go here.</Text>
            </Card>
        ),
    },
};

export const Collapsed: Story = {
    args: {
        title: 'Flash (8)',
        defaultOpen: false,
        children: (
            <Card>
                <Text variant="body">Contents go here.</Text>
            </Card>
        ),
    },
};
