import { ReactNode } from 'react';

import { Text } from '../primitives/Text';

export interface AuthLayoutProps {
    children: ReactNode;
    title: string;
    description: string;
    appName?: string;
}

export function AuthLayout({ children, title, description, appName = 'Bucabull' }: AuthLayoutProps) {
    return (
        <div className="flex min-h-svh flex-col items-center justify-center gap-8 bg-background p-6">
            <div className="flex w-full max-w-sm flex-col gap-8">
                <div className="flex flex-col items-center gap-4 text-center">
                    <Text variant="muted" className="font-heading tracking-wide uppercase">
                        {appName}
                    </Text>
                    <div className="space-y-2">
                        <Text variant="heading">{title}</Text>
                        <Text variant="muted">{description}</Text>
                    </div>
                </div>
                {children}
            </div>
        </div>
    );
}
