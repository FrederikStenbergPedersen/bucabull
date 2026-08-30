import type { Meta, StoryObj } from '@storybook/react-vite';

import { SidebarNavItem } from './SidebarNavItem';

const meta: Meta<typeof SidebarNavItem> = {
    title: 'Patterns/SidebarNavItem',
    component: SidebarNavItem,
    decorators: [(Story) => <div className="w-56"><Story /></div>],
};
export default meta;

type Story = StoryObj<typeof SidebarNavItem>;

export const Active: Story = {
    args: { href: '#', active: true, children: 'Roster' },
};

export const Inactive: Story = {
    args: { href: '#', active: false, children: 'Grenades' },
};

export const WithTrailing: Story = {
    args: { href: '#', active: false, children: 'Mirage', trailing: <span className="text-xs text-muted-foreground">4</span> },
};

export const Unidentified: Story = {
    args: { href: '#', active: false, unidentified: true, children: 'Some custom map', trailing: <span className="text-xs text-muted-foreground">2</span> },
};

export const WithBackgroundImage: Story = {
    args: {
        href: '#',
        active: true,
        children: 'Mirage',
        trailing: <span className="text-xs text-white/80">4</span>,
        backgroundImage: 'https://placehold.co/224x40',
    },
};
