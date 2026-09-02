import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';

import { DemoRoundList } from './DemoRoundList';

const meta: Meta<typeof DemoRoundList> = {
    title: 'Patterns/DemoRoundList',
    component: DemoRoundList,
};
export default meta;

type Story = StoryObj<typeof DemoRoundList>;

const ROUNDS = Array.from({ length: 16 }, (_, i) => ({
    roundNumber: i + 1,
    winner: (i % 3 === 0 ? '' : i % 2 === 0 ? 'CT' : 'T') as 'CT' | 'T' | '',
}));

export const Interactive: Story = {
    render: () => {
        const [activeIndex, setActiveIndex] = useState(3);
        return <DemoRoundList rounds={ROUNDS} activeIndex={activeIndex} onSelect={setActiveIndex} />;
    },
};
