import type { Meta, StoryObj } from '@storybook/react-vite';
import { Coins, Crosshair, Zap } from 'lucide-react';
import { useState } from 'react';

import { MultiSegmentedControl } from './MultiSegmentedControl';

const meta: Meta<typeof MultiSegmentedControl> = {
    title: 'Primitives/MultiSegmentedControl',
    component: MultiSegmentedControl,
};
export default meta;

type Story = StoryObj<typeof MultiSegmentedControl>;

export const StrategyTypes: Story = {
    render: () => {
        const [value, setValue] = useState<string[]>(['buyround']);
        return (
            <MultiSegmentedControl
                value={value}
                onChange={setValue}
                options={[
                    { value: 'buyround', label: 'Buy round', icon: <Coins className="size-4" /> },
                    { value: 'force', label: 'Force', icon: <Zap className="size-4" /> },
                    { value: 'pistol', label: 'Pistol', icon: <Crosshair className="size-4" /> },
                ]}
            />
        );
    },
};
