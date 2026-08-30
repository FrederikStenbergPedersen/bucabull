import type { Meta, StoryObj } from '@storybook/react-vite';

import {
    JumpJumpingIcon,
    JumpStandingIcon,
    MovementRunningIcon,
    MovementStandingIcon,
    MovementWalkingIcon,
    StanceCrouchingIcon,
    StanceStandingIcon,
    ThrowBothClickIcon,
    ThrowLeftClickIcon,
    ThrowRightClickIcon,
    TypeFlashIcon,
    TypeGrenadeIcon,
    TypeMolotovIcon,
    TypeSmokeIcon,
} from './grenade-icons';

const icons = {
    ThrowLeftClickIcon,
    ThrowRightClickIcon,
    ThrowBothClickIcon,
    StanceStandingIcon,
    StanceCrouchingIcon,
    MovementStandingIcon,
    MovementWalkingIcon,
    MovementRunningIcon,
    JumpStandingIcon,
    JumpJumpingIcon,
    TypeSmokeIcon,
    TypeFlashIcon,
    TypeGrenadeIcon,
    TypeMolotovIcon,
};

function AllIcons() {
    return (
        <div className="grid grid-cols-4 gap-6">
            {Object.entries(icons).map(([name, Icon]) => (
                <div key={name} className="flex flex-col items-center gap-2 text-xs text-muted-foreground">
                    <Icon className="size-8" />
                    {name}
                </div>
            ))}
        </div>
    );
}

const meta: Meta<typeof AllIcons> = {
    title: 'Icons/GrenadeIcons',
    component: AllIcons,
};
export default meta;

type Story = StoryObj<typeof AllIcons>;

export const All: Story = {};
