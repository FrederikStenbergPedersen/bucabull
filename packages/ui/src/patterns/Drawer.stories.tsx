import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';

import { Button } from '../primitives/Button';
import { Text } from '../primitives/Text';
import { Drawer } from './Drawer';

const meta: Meta<typeof Drawer> = {
    title: 'Patterns/Drawer',
    component: Drawer,
};
export default meta;

type Story = StoryObj<typeof Drawer>;

export const Default: Story = {
    render: () => {
        const [open, setOpen] = useState(false);
        return (
            <>
                <Button onClick={() => setOpen(true)}>Open drawer</Button>
                <Drawer open={open} onClose={() => setOpen(false)} title="Add grenade">
                    <Text variant="body">Drawer content goes here.</Text>
                </Drawer>
            </>
        );
    },
};

export const InitiallyOpen: Story = {
    render: () => {
        const [open, setOpen] = useState(true);
        return (
            <Drawer open={open} onClose={() => setOpen(false)} title="Edit grenade">
                <Text variant="body">Escape, the X button, or clicking outside all close this.</Text>
            </Drawer>
        );
    },
};
