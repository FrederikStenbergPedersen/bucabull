import type { Meta, StoryObj } from '@storybook/react-vite';

import { Card } from '../primitives/Card';
import { Text } from '../primitives/Text';
import { SidebarNavItem } from './SidebarNavItem';
import { TeamLayout } from './TeamLayout';

const meta: Meta<typeof TeamLayout> = {
    title: 'Patterns/TeamLayout',
    component: TeamLayout,
};
export default meta;

type Story = StoryObj<typeof TeamLayout>;

const placeholder = (
    <Card>
        <Text variant="body">Page content goes here.</Text>
    </Card>
);

export const SingleTool: Story = {
    args: {
        navItems: [{ label: 'Roster', href: '#', active: true }],
        onLogout: () => {},
        children: placeholder,
    },
};

export const MultipleTools: Story = {
    args: {
        navItems: [
            { label: 'Roster', href: '#', active: true },
            { label: 'Grenades', href: '#', active: false },
        ],
        onLogout: () => {},
        children: placeholder,
    },
};

export const WithSidebarExtra: Story = {
    args: {
        navItems: [
            { label: 'Roster', href: '#', active: false },
            { label: 'Grenades', href: '#', active: true },
        ],
        onLogout: () => {},
        sidebarExtra: (
            <div className="flex flex-col gap-1 border-t border-border pt-4">
                <SidebarNavItem href="#" active trailing={<span className="text-xs text-muted-foreground">4</span>}>
                    Mirage
                </SidebarNavItem>
                <SidebarNavItem href="#" active={false} trailing={<span className="text-xs text-muted-foreground">0</span>}>
                    Inferno
                </SidebarNavItem>
            </div>
        ),
        children: placeholder,
    },
};

export const Guest: Story = {
    args: {
        navItems: [{ label: 'Roster', href: '#', active: true }],
        children: placeholder,
    },
};
