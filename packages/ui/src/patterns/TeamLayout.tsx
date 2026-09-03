import { ElementType, ReactNode } from 'react';

import { cn } from '../lib/cn';
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
    /** Overrides the content column's max-width (default `max-w-3xl`, right for most pages) — e.g. a wider column for a tool like the demo viewer that needs room for a radar beside a kill feed. */
    contentClassName?: string;
    children: ReactNode;
}

// No responsive collapse here — an icon-only rail would need icons for
// every top-level nav item (Roster, Grenades, ...), which don't exist.
// This app has no other mobile handling today either; a fixed-width
// sidebar is a deliberate, disclosed gap, not an oversight.
export function TeamLayout({ navItems, onLogout, linkAs, sidebarExtra, contentClassName, children }: TeamLayoutProps) {
    return (
        <div className="bg-background relative min-h-svh">
            <AmbientBackdrop />

            <div className="relative flex min-h-svh">
                <aside className="animate-fade-in-up border-border flex w-56 shrink-0 flex-col gap-6 border-r p-6">
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
                    <div className={cn('mx-auto flex flex-col gap-6', contentClassName ?? 'max-w-3xl')}>{children}</div>
                </main>
            </div>
        </div>
    );
}
