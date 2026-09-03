import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';

import { RangeSlider } from './RangeSlider';

const meta: Meta<typeof RangeSlider> = {
    title: 'Primitives/RangeSlider',
    component: RangeSlider,
};
export default meta;

type Story = StoryObj<typeof RangeSlider>;

export const Default: Story = {
    render: () => {
        const [value, setValue] = useState(30);
        return <RangeSlider min={0} max={100} value={value} onChange={setValue} />;
    },
};

export const Disabled: Story = {
    args: { min: 0, max: 100, value: 30, disabled: true, onChange: () => {} },
};
