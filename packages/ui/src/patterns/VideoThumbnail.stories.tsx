import type { Meta, StoryObj } from '@storybook/react-vite';

import { VideoThumbnail } from './VideoThumbnail';

const meta: Meta<typeof VideoThumbnail> = {
    title: 'Patterns/VideoThumbnail',
    component: VideoThumbnail,
    decorators: [(Story) => <div className="w-64"><Story /></div>],
};
export default meta;

type Story = StoryObj<typeof VideoThumbnail>;

export const YouTubeLink: Story = {
    args: {
        videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    },
};

export const WithScreenshotPoster: Story = {
    args: {
        videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        posterUrl: 'https://placehold.co/640x360',
    },
};

export const OtherHostNoPreview: Story = {
    args: {
        videoUrl: 'https://example.com/some-clip',
    },
};

export const NoVideo: Story = {
    args: {},
};
