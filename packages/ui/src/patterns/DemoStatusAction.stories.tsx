import type { Meta, StoryObj } from '@storybook/react-vite';

import { DemoStatusAction } from './DemoStatusAction';

const meta: Meta<typeof DemoStatusAction> = {
    title: 'Patterns/DemoStatusAction',
    component: DemoStatusAction,
    args: {
        onFileSelected: () => {},
    },
};
export default meta;

type Story = StoryObj<typeof DemoStatusAction>;

export const None: Story = { args: { status: 'none' } };
export const Uploading: Story = { args: { status: 'uploading', uploadProgress: 42 } };
export const Processing: Story = { args: { status: 'processing' } };
export const Ready: Story = { args: { status: 'ready', watchHref: '#' } };
export const Failed: Story = { args: { status: 'failed', errorMessage: 'Parse failed — the uploaded file may be corrupt.' } };
