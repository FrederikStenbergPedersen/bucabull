import type { Meta, StoryObj } from '@storybook/react-vite';

import { SteamSignInButton } from './SteamSignInButton';

const meta: Meta<typeof SteamSignInButton> = {
    title: 'Primitives/SteamSignInButton',
    component: SteamSignInButton,
};
export default meta;

type Story = StoryObj<typeof SteamSignInButton>;

export const Default: Story = {
    args: { href: '#' },
};
