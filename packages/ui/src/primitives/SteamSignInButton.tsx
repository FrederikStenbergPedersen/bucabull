import { AnchorHTMLAttributes } from 'react';

import steamSignIn from '../assets/steam-sign-in.png';
import { cn } from '../lib/cn';

/**
 * Valve's official "Sign in through Steam" button. Their branding
 * guidelines require using this exact artwork unmodified — no recoloring,
 * no redrawing it with our own tokens — so unlike every other primitive
 * here, this one intentionally does NOT compose from theme colors.
 * Hover/focus affordance is limited to opacity/ring, never a color or
 * redraw change.
 */
export function SteamSignInButton({ className, ...props }: AnchorHTMLAttributes<HTMLAnchorElement>) {
    return (
        <a
            className={cn(
                'inline-block cursor-pointer rounded-sm transition-opacity hover:opacity-90',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                className,
            )}
            {...props}
        >
            <img src={steamSignIn} alt="Sign in through Steam" width={180} height={35} />
        </a>
    );
}
