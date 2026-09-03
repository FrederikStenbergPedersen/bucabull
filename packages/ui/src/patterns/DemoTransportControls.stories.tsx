import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';

import { DemoTransportControls } from './DemoTransportControls';

const meta: Meta<typeof DemoTransportControls> = {
    title: 'Patterns/DemoTransportControls',
    component: DemoTransportControls,
};
export default meta;

type Story = StoryObj<typeof DemoTransportControls>;

export const Interactive: Story = {
    render: () => {
        const [isPlaying, setIsPlaying] = useState(false);
        const [timeS, setTimeS] = useState(42);
        const [speed, setSpeed] = useState(1);

        return (
            <DemoTransportControls
                isPlaying={isPlaying}
                onTogglePlay={() => setIsPlaying((p) => !p)}
                timeS={timeS}
                durationS={115}
                onSeek={setTimeS}
                speed={speed}
                speedOptions={[0.5, 1, 2, 4]}
                onSpeedChange={setSpeed}
                onPrevRound={() => {}}
                onNextRound={() => {}}
                canGoPrevRound={true}
                canGoNextRound={true}
            />
        );
    },
};

export const AtFirstRound: Story = {
    args: {
        isPlaying: false,
        timeS: 0,
        durationS: 90,
        speed: 1,
        speedOptions: [0.5, 1, 2, 4],
        canGoPrevRound: false,
        canGoNextRound: true,
        onTogglePlay: () => {},
        onSeek: () => {},
        onSpeedChange: () => {},
        onPrevRound: () => {},
        onNextRound: () => {},
    },
};
