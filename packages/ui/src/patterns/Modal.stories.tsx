import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';

import { Button } from '../primitives/Button';
import { Text } from '../primitives/Text';
import { Modal } from './Modal';

const meta: Meta<typeof Modal> = {
    title: 'Patterns/Modal',
    component: Modal,
};
export default meta;

type Story = StoryObj<typeof Modal>;

export const Default: Story = {
    render: () => {
        const [open, setOpen] = useState(false);
        return (
            <>
                <Button onClick={() => setOpen(true)}>Open modal</Button>
                <Modal open={open} onClose={() => setOpen(false)}>
                    <div className="flex flex-col gap-4 p-5">
                        <Text variant="subheading">Modal content</Text>
                        <Text variant="body">Escape or clicking outside both close this.</Text>
                        <Button onClick={() => setOpen(false)}>Close</Button>
                    </div>
                </Modal>
            </>
        );
    },
};

export const InitiallyOpen: Story = {
    render: () => {
        const [open, setOpen] = useState(true);
        return (
            <Modal open={open} onClose={() => setOpen(false)}>
                <div className="flex flex-col gap-4 p-5">
                    <Text variant="body">Centered, scale + fade instead of Drawer's slide.</Text>
                </div>
            </Modal>
        );
    },
};
