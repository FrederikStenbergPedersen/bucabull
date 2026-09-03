import type { Meta, StoryObj } from '@storybook/react-vite';

import { MentionText } from './MentionText';

const meta: Meta<typeof MentionText> = {
    title: 'Patterns/MentionText',
    component: MentionText,
};
export default meta;

type Story = StoryObj<typeof MentionText>;

export const Default: Story = {
    args: {
        value: '@[Player1](player:1) throws a #[Smoke](type:smoke) at #[Mid Smoke](utility:10).',
        resolvers: [{ kind: 'utility', lookup: (id) => (id === '10' ? { label: 'Mid Smoke' } : undefined) }],
    },
};

export const WithDeletedReference: Story = {
    args: {
        value: 'Falls back to the stored label when #[Old Utility](utility:99) no longer resolves.',
        resolvers: [{ kind: 'utility', lookup: () => undefined }],
    },
};
