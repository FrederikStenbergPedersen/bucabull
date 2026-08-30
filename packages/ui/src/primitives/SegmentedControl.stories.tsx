import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';

import { ThrowBothClickIcon, ThrowLeftClickIcon, ThrowRightClickIcon, TypeFlashIcon, TypeGrenadeIcon, TypeMolotovIcon, TypeSmokeIcon } from '../icons/grenade-icons';
import { SegmentedControl } from './SegmentedControl';

const meta: Meta<typeof SegmentedControl> = {
    title: 'Primitives/SegmentedControl',
    component: SegmentedControl,
};
export default meta;

type Story = StoryObj<typeof SegmentedControl>;

export const ThrowButton: Story = {
    render: () => {
        const [value, setValue] = useState('left');
        return (
            <SegmentedControl
                value={value}
                onChange={setValue}
                options={[
                    { value: 'left', label: 'Left click', icon: <ThrowLeftClickIcon className="size-4" /> },
                    { value: 'right', label: 'Right click', icon: <ThrowRightClickIcon className="size-4" /> },
                    { value: 'both', label: 'Both', icon: <ThrowBothClickIcon className="size-4" /> },
                ]}
            />
        );
    },
};

export const TypeMdSize: Story = {
    render: () => {
        const [value, setValue] = useState('smoke');
        return (
            <SegmentedControl
                size="md"
                value={value}
                onChange={setValue}
                options={[
                    { value: 'smoke', label: 'Smoke', icon: <TypeSmokeIcon className="size-6" /> },
                    { value: 'flash', label: 'Flash', icon: <TypeFlashIcon className="size-6" /> },
                    { value: 'grenade', label: 'Grenade', icon: <TypeGrenadeIcon className="size-6" /> },
                    { value: 'molotov', label: 'Molotov', icon: <TypeMolotovIcon className="size-6" /> },
                ]}
            />
        );
    },
};
