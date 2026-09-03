/**
 * Canonical color values, derived from the actual team logo (pixel-sampled,
 * not guessed): blue ~#2ce3fc (the horns / "BUCA" half of the wordmark),
 * dark navy-black background ~#0a0e15. The logo's orange (the bull) was
 * dropped as a general-purpose UI accent — `accent` was originally that
 * orange, but reads as too loud for frequent in-context actions, so it's
 * now the same blue as `accentSecondary`. Both tokens are kept (rather than
 * collapsed into one) so existing `accent`/`accent-secondary` class usages
 * across the app didn't all need touching.
 *
 * `warning` brings a version of that orange back, but scoped to one
 * specific, infrequent use: the CS T/CT side marker, where T needs its own
 * lively color the way CT has `accent-secondary` blue — gray read as
 * "unset" rather than "the other team". This isn't the loud bull-orange;
 * it's tuned like the other semantic tones (destructive/positive) for a
 * small dot or badge, not a button someone stares at all day.
 *
 * `theme.css` mirrors these as Tailwind v4 `@theme` variables — if you
 * change a value here, update theme.css to match (kept hand-in-sync rather
 * than generated, since the palette is still small).
 */
export const colors = {
    dark: {
        background: 'hsl(220, 20%, 6%)',
        foreground: 'hsl(0, 0%, 96%)',
        card: 'hsl(220, 18%, 10%)',
        cardForeground: 'hsl(0, 0%, 96%)',
        border: 'hsl(220, 16%, 18%)',
        input: 'hsl(220, 16%, 20%)',
        muted: 'hsl(220, 16%, 14%)',
        mutedForeground: 'hsl(220, 10%, 62%)',
        accent: 'hsl(187, 90%, 55%)',
        accentForeground: 'hsl(220, 15%, 9%)',
        accentSecondary: 'hsl(187, 90%, 55%)',
        accentSecondaryForeground: 'hsl(220, 15%, 9%)',
        destructive: 'hsl(0, 72%, 58%)',
        destructiveForeground: 'hsl(0, 0%, 98%)',
        positive: 'hsl(142, 71%, 45%)',
        positiveForeground: 'hsl(220, 15%, 9%)',
        warning: 'hsl(32, 90%, 55%)',
        warningForeground: 'hsl(220, 15%, 9%)',
        ring: 'hsl(187, 90%, 55%)',
        // CS2 team colors for the demo viewer's radar (player dots,
        // facing cones) — not used for general UI chrome. Deliberately
        // NOT the brand's own cyan accent (hue ~187) for teamCt, since a
        // radar full of accent-colored dots would be unreadable against
        // this app's accent-cyan UI chrome around it; shifted to a
        // clearly "blue" hue instead. teamT is the traditional CS
        // orange/tan, which the brand palette dropped entirely (see this
        // file's top comment) so there's no clash to avoid there.
        teamCt: 'hsl(217, 85%, 65%)',
        teamT: 'hsl(32, 90%, 58%)',
    },
    light: {
        background: 'hsl(210, 20%, 98%)',
        foreground: 'hsl(220, 15%, 10%)',
        card: 'hsl(0, 0%, 100%)',
        cardForeground: 'hsl(220, 15%, 10%)',
        border: 'hsl(220, 14%, 88%)',
        input: 'hsl(220, 14%, 85%)',
        muted: 'hsl(220, 14%, 94%)',
        mutedForeground: 'hsl(220, 8%, 40%)',
        accent: 'hsl(195, 88%, 38%)',
        accentForeground: 'hsl(0, 0%, 100%)',
        accentSecondary: 'hsl(195, 88%, 38%)',
        accentSecondaryForeground: 'hsl(0, 0%, 100%)',
        destructive: 'hsl(0, 72%, 48%)',
        destructiveForeground: 'hsl(0, 0%, 98%)',
        positive: 'hsl(142, 71%, 36%)',
        positiveForeground: 'hsl(0, 0%, 100%)',
        warning: 'hsl(24, 85%, 42%)',
        warningForeground: 'hsl(0, 0%, 100%)',
        ring: 'hsl(195, 88%, 38%)',
        // See the dark palette's teamCt/teamT comment — same colors in
        // both modes since these paint over a radar image, not the
        // page's own light/dark background.
        teamCt: 'hsl(217, 85%, 65%)',
        teamT: 'hsl(32, 90%, 58%)',
    },
} as const;
