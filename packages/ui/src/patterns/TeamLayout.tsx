import { ElementType, ReactNode } from 'react';

import { Button } from '../primitives/Button';
import { Text } from '../primitives/Text';
import { AmbientBackdrop } from './AmbientBackdrop';
import { SidebarNavItem } from './SidebarNavItem';

export interface TeamNavItem {
    label: string;
    href: string;
    active: boolean;
}

export interface TeamLayoutProps {
    navItems: TeamNavItem[];
    onLogout?: () => void;
    linkAs?: ElementType;
    /** A tool's own contextual sub-nav (e.g. Grenades' map switcher), rendered in the same sidebar column. */
    sidebarExtra?: ReactNode;
    children: ReactNode;
}

// No responsive collapse here — an icon-only rail would need icons for
// every top-level nav item (Roster, Grenades, ...), which don't exist.
// This app has no other mobile handling today either; a fixed-width
// sidebar is a deliberate, disclosed gap, not an oversight.
export function TeamLayout({ navItems, onLogout, linkAs, sidebarExtra, children }: TeamLayoutProps) {
    return (
        <div className="relative min-h-svh bg-background">
            <AmbientBackdrop />

            <div className="relative flex min-h-svh">
                <aside className="animate-fade-in-up flex w-56 shrink-0 flex-col gap-6 border-r border-border p-6">
                    <Text variant="subheading" className="tracking-wide uppercase">
                        Bucabull
                    </Text>

                    <nav className="flex flex-col gap-1">
                        {navItems.map((item) => (
                            <SidebarNavItem key={item.href} href={item.href} active={item.active} linkAs={linkAs}>
                                {item.label}
                            </SidebarNavItem>
                        ))}
                    </nav>

                    {sidebarExtra}

                    {onLogout && (
                        <Button variant="secondary" onClick={onLogout} className="mt-auto">
                            Log out
                        </Button>
                    )}
                </aside>

                <main className="min-w-0 flex-1 p-8">
                    <div className="mx-auto flex max-w-3xl flex-col gap-6">{children}</div>
                </main>
            </div>
        </div>
    );
}
