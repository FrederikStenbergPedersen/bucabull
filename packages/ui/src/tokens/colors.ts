/**
 * Canonical color values. `theme.css` mirrors these as Tailwind v4 `@theme`
 * variables — if you change a value here, update theme.css to match (kept
 * hand-in-sync rather than generated, since the palette is still small).
 */
export const colors = {
    dark: {
        background: 'hsl(220, 9%, 7%)',
        foreground: 'hsl(0, 0%, 96%)',
        card: 'hsl(220, 9%, 10%)',
        cardForeground: 'hsl(0, 0%, 96%)',
        border: 'hsl(220, 8%, 18%)',
        input: 'hsl(220, 8%, 20%)',
        muted: 'hsl(220, 8%, 14%)',
        mutedForeground: 'hsl(220, 6%, 62%)',
        accent: 'hsl(38, 92%, 50%)',
        accentForeground: 'hsl(220, 9%, 9%)',
        destructive: 'hsl(0, 72%, 58%)',
        destructiveForeground: 'hsl(0, 0%, 98%)',
        ring: 'hsl(38, 92%, 50%)',
    },
    light: {
        background: 'hsl(40, 20%, 99%)',
        foreground: 'hsl(220, 9%, 10%)',
        card: 'hsl(0, 0%, 100%)',
        cardForeground: 'hsl(220, 9%, 10%)',
        border: 'hsl(220, 10%, 88%)',
        input: 'hsl(220, 10%, 85%)',
        muted: 'hsl(220, 10%, 94%)',
        mutedForeground: 'hsl(220, 6%, 40%)',
        accent: 'hsl(32, 90%, 45%)',
        accentForeground: 'hsl(0, 0%, 100%)',
        destructive: 'hsl(0, 72%, 48%)',
        destructiveForeground: 'hsl(0, 0%, 98%)',
        ring: 'hsl(32, 90%, 45%)',
    },
} as const;
