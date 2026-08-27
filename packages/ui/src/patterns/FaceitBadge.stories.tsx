import type { Meta, StoryObj } from '@storybook/react-vite';

import { FaceitBadge } from './FaceitBadge';

const meta: Meta<typeof FaceitBadge> = {
    title: 'Patterns/FaceitBadge',
    component: FaceitBadge,
};
export default meta;

type Story = StoryObj<typeof FaceitBadge>;

export const Level2: Story = {
    args: { level: 2, elo: 850 },
};

export const Level5: Story = {
    args: { level: 5, elo: 1550 },
};

export const Level8: Story = {
    args: { level: 8, elo: 2050 },
};

export const Level10: Story = {
    args: { level: 10, elo: 2650 },
};

export const AllLevels: Story = {
    render: () => (
        <div className="flex flex-wrap gap-2">
            {Array.from({ length: 10 }, (_, i) => i + 1).map((level) => (
                <FaceitBadge key={level} level={level} elo={800 + level * 150} />
            ))}
        </div>
    ),
};
