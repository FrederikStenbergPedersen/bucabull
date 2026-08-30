import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';

import { ScreenshotUpload } from './ScreenshotUpload';

const meta: Meta<typeof ScreenshotUpload> = {
    title: 'Patterns/ScreenshotUpload',
    component: ScreenshotUpload,
};
export default meta;

type Story = StoryObj<typeof ScreenshotUpload>;

export const Default: Story = {
    render: () => {
        const [files, setFiles] = useState<File[]>([]);
        return <ScreenshotUpload files={files} onChange={setFiles} />;
    },
};

export const WithError: Story = {
    render: () => {
        const [files, setFiles] = useState<File[]>([]);
        return <ScreenshotUpload files={files} onChange={setFiles} errors={['A grenade can have at most 3 screenshots.']} />;
    },
};
