import { ElementType, ReactNode } from 'react';

import { cn } from '../lib/cn';
import { Card } from './Card';

export interface LinkableCardProps {
    children: ReactNode;
    className?: string;
    /** When set, the whole card becomes a link (e.g. to a player's match history). */
    href?: string;
    /** Injects Inertia's `Link` (or another router component) in place of a plain `<a>` — keeps this package framework-agnostic. */
    linkAs?: ElementType;
    /**
     * A background photo (e.g. a MatchCard's map overview) filling the
     * whole card behind a dark gradient, same treatment as
     * SidebarNavItem's backgroundImage — text is forced white by the
     * caller since the theme's foreground colors aren't guaranteed to
     * read over a photo.
     */
    backgroundImage?: string | null;
}

/**
 * The flex-row Card chrome shared by RosterCard and MatchCard — the hover
 * treatment and optional whole-card link, factored out so both list-row
 * patterns build on one implementation instead of duplicating it.
 */
export function LinkableCard({ children, className, href, linkAs: LinkAs = 'a', backgroundImage }: LinkableCardProps) {
    const card = (
        <Card
            style={backgroundImage ? { backgroundImage: `url(${backgroundImage})` } : undefined}
            className={cn(
                href && 'hover:border-accent-secondary transition-colors',
                backgroundImage && 'relative overflow-hidden bg-cover bg-center',
            )}
        >
            {backgroundImage && <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/60 to-black/35" />}
            <div className={cn('relative flex items-center gap-4', className)}>{children}</div>
        </Card>
    );

    if (!href) {
        return card;
    }

    return (
        <LinkAs href={href} className="block">
            {card}
        </LinkAs>
    );
}
