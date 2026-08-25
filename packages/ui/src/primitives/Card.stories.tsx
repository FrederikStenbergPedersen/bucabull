import type { Meta, StoryObj } from '@storybook/react-vite';

import { Card } from './Card';
import { Text } from './Text';

const meta: Meta<typeof Card> = {
    title: 'Primitives/Card',
    component: Card,
};
export default meta;

type Story = StoryObj<typeof Card>;

export const Default: Story = {
    render: () => (
        <Card className="w-80">
            <Text variant="heading">Card title</Text>
            <Text variant="muted" className="mt-2">
                Supporting body copy goes here.
            </Text>
        </Card>
    ),
};
