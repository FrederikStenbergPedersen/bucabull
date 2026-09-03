import { ReactNode } from 'react';

import { cn } from '../lib/cn';

export interface DemoRadarOverlayProps {
    position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
    className?: string;
    children: ReactNode;
}

const positionClasses: Record<NonNullable<DemoRadarOverlayProps['position']>, string> = {
    'top-right': 'top-3 right-3',
    'top-left': 'top-3 left-3',
    'bottom-right': 'bottom-3 right-3',
    'bottom-left': 'bottom-3 left-3',
};

/**
 * A translucent HUD-style panel meant to sit on top of DemoRadar (inside
 * a `relative`-positioned wrapper around it) — e.g. the kill feed, closer
 * to real CS2's own in-game overlay than a separate layout column. Not
 * DemoRadar's own concern: DemoRadar stays a plain square canvas, any
 * number of these can be composed around/on top of it by the page.
 */
export function DemoRadarOverlay({ position = 'top-right', className, children }: DemoRadarOverlayProps) {
    return (
        <div
            className={cn(
                'border-border/60 bg-background/75 absolute w-56 rounded-md border p-3 backdrop-blur-sm',
                positionClasses[position],
                className,
            )}
        >
            {children}
        </div>
    );
}
