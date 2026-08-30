import { ElementType, MouseEvent, ReactNode } from 'react';

import { cn } from '../lib/cn';

export interface SidebarNavItemProps {
    active: boolean;
    href: string;
    icon?: ReactNode;
    trailing?: ReactNode;
    linkAs?: ElementType;
    onClick?: (e: MouseEvent) => void;
    /** A background photo (e.g. a map overview) — rendered with a dark gradient overlay so text stays legible over it. */
    backgroundImage?: string | null;
    /** A generic textured background for an item with no specific image (e.g. an unrecognized custom map). Ignored when backgroundImage is set. */
    unidentified?: boolean;
    children: ReactNode;
}

/**
 * A single sidebar row — used by TeamLayout for its own primary nav, and
 * exported so a tool can build a matching contextual sub-list (e.g.
 * Grenades' map switcher) in the same visual language instead of
 * hand-rolling raw markup that has to be eyeballed into sync.
 */
export function SidebarNavItem({
    active,
    href,
    icon,
    trailing,
    linkAs: LinkAs = 'a',
    onClick,
    backgroundImage,
    unidentified,
    children,
}: SidebarNavItemProps) {
    if (backgroundImage) {
        return (
            <LinkAs
                href={href}
                onClick={onClick}
                style={{ backgroundImage: `url(${backgroundImage})` }}
                className={cn(
                    'relative flex items-center gap-2.5 overflow-hidden rounded-md bg-cover bg-center px-3 py-2 text-sm font-medium text-white',
                    active && 'ring-2 ring-accent ring-inset',
                )}
            >
                <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 to-black/45" />
                {icon && <span className="relative shrink-0">{icon}</span>}
                <span className="relative min-w-0 flex-1 truncate drop-shadow">{children}</span>
                {trailing && <span className="relative rounded bg-black/40 px-1.5 py-0.5 text-xs font-semibold text-white">{trailing}</span>}
            </LinkAs>
        );
    }

    return (
        <LinkAs
            href={href}
            onClick={onClick}
            className={cn(
                'flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                unidentified && 'sidebar-item-unidentified',
                active ? 'bg-muted text-foreground ring-1 ring-accent' : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
            )}
        >
            {icon}
            <span className="min-w-0 flex-1 truncate">{children}</span>
            {trailing}
        </LinkAs>
    );
}
