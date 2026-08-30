import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';

import { Button } from '../primitives/Button';
import { ConfirmDialog } from './ConfirmDialog';

const meta: Meta<typeof ConfirmDialog> = {
    title: 'Patterns/ConfirmDialog',
    component: ConfirmDialog,
};
export default meta;

type Story = StoryObj<typeof ConfirmDialog>;

export const Destructive: Story = {
    render: () => {
        const [open, setOpen] = useState(false);
        return (
            <>
                <Button variant="ghost" onClick={() => setOpen(true)}>
                    Delete utility
                </Button>
                <ConfirmDialog
                    open={open}
                    onCancel={() => setOpen(false)}
                    onConfirm={() => setOpen(false)}
                    title="Delete this utility?"
                    description="This can't be undone — its screenshots are deleted too."
                    confirmLabel="Delete"
                    destructive
                />
            </>
        );
    },
};

export const NonDestructive: Story = {
    render: () => {
        const [open, setOpen] = useState(false);
        return (
            <>
                <Button variant="secondary" onClick={() => setOpen(true)}>
                    Leave team
                </Button>
                <ConfirmDialog
                    open={open}
                    onCancel={() => setOpen(false)}
                    onConfirm={() => setOpen(false)}
                    title="Leave this team?"
                    confirmLabel="Leave"
                />
            </>
        );
    },
};
