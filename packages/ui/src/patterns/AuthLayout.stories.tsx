import type { Meta, StoryObj } from '@storybook/react-vite';

import { Button } from '../primitives/Button';
import { Input } from '../primitives/Input';
import { Label } from '../primitives/Label';
import { AuthLayout } from './AuthLayout';

const meta: Meta<typeof AuthLayout> = {
    title: 'Patterns/AuthLayout',
    component: AuthLayout,
};
export default meta;

type Story = StoryObj<typeof AuthLayout>;

export const LoginShape: Story = {
    args: {
        title: 'Log in to your account',
        description: 'Enter your email and password below to log in',
        children: (
            <div className="flex flex-col gap-6">
                <div className="grid gap-2">
                    <Label htmlFor="email">Email address</Label>
                    <Input id="email" type="email" placeholder="email@example.com" />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="password">Password</Label>
                    <Input id="password" type="password" placeholder="Password" />
                </div>
                <Button type="submit" className="w-full">
                    Log in
                </Button>
            </div>
        ),
    },
};
