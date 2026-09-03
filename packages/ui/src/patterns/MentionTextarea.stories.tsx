import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';

import { MentionTextarea } from './MentionTextarea';

const meta: Meta<typeof MentionTextarea> = {
    title: 'Patterns/MentionTextarea',
    component: MentionTextarea,
};
export default meta;

type Story = StoryObj<typeof MentionTextarea>;

export const Default: Story = {
    render: () => {
        const [value, setValue] = useState('Type @ for a player, or # for utility.');
        return (
            <MentionTextarea
                value={value}
                onChange={setValue}
                triggers={[
                    {
                        char: '@',
                        sections: [
                            {
                                heading: 'Roster',
                                items: [
                                    { id: 1, kind: 'player', label: 'Player1' },
                                    { id: 2, kind: 'player', label: 'Player2' },
                                    { id: 3, kind: 'player', label: 'Player3' },
                                ],
                            },
                        ],
                    },
                    {
                        char: '#',
                        sections: [
                            {
                                heading: 'Utility',
                                items: [
                                    { id: 10, kind: 'utility', label: 'Mid Smoke', sublabel: 'Smoke · T' },
                                    { id: 11, kind: 'utility', label: 'A Flash', sublabel: 'Flash · CT' },
                                ],
                            },
                        ],
                    },
                ]}
            />
        );
    },
};
