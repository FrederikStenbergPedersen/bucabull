/**
 * Deliberately not Inter — Inter is shadcn/ui's own default and the single
 * most common "AI-generated app" tell. Space Grotesk (headings) + Public
 * Sans (body) reads distinct, both free/self-hostable via Bunny Fonts.
 */
export const typography = {
    fontHeading: "'Space Grotesk', ui-sans-serif, system-ui, sans-serif",
    fontSans: "'Public Sans', ui-sans-serif, system-ui, sans-serif",
    scale: {
        xs: '0.75rem',
        sm: '0.875rem',
        base: '1rem',
        lg: '1.125rem',
        xl: '1.25rem',
        '2xl': '1.5rem',
        '3xl': '1.875rem',
    },
} as const;
