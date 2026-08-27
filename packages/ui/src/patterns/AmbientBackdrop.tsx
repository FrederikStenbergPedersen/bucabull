import { cn } from '../lib/cn';

const SPARKS = [
    { top: '14%', left: '20%', size: 3, duration: '3.6s', delay: '0s', tone: 'bg-accent-secondary' },
    { top: '24%', left: '80%', size: 2, duration: '4.4s', delay: '0.6s', tone: 'bg-accent' },
    { top: '58%', left: '10%', size: 2, duration: '5s', delay: '1.2s', tone: 'bg-accent' },
    { top: '70%', left: '88%', size: 3, duration: '3.9s', delay: '0.3s', tone: 'bg-accent-secondary' },
    { top: '40%', left: '50%', size: 2, duration: '4.7s', delay: '1.6s', tone: 'bg-accent-secondary' },
    { top: '86%', left: '38%', size: 2, duration: '4.1s', delay: '0.9s', tone: 'bg-accent' },
    { top: '8%', left: '55%', size: 2, duration: '5.3s', delay: '2s', tone: 'bg-accent' },
] as const;

// Small, crisp-edged low-poly facets — the shattered-glass fragments
// scattered across the team crest's background art, not a bold shape.
const FACETS = [
    { top: '4%', left: '6%', size: 130, rotate: -18, tone: 'bg-foreground/[0.035]', clip: 'polygon(0% 15%, 70% 0%, 100% 100%, 15% 85%)' },
    { top: '58%', left: '-2%', size: 160, rotate: 8, tone: 'bg-foreground/[0.03]', clip: 'polygon(0% 0%, 100% 25%, 60% 100%, 0% 80%)' },
    { top: '12%', left: '86%', size: 150, rotate: 24, tone: 'bg-accent-secondary/[0.07]', clip: 'polygon(20% 0%, 100% 10%, 80% 100%, 0% 70%)' },
    { top: '68%', left: '90%', size: 140, rotate: -10, tone: 'bg-accent/[0.06]', clip: 'polygon(0% 20%, 80% 0%, 100% 90%, 20% 100%)' },
    { top: '38%', left: '46%', size: 90, rotate: 32, tone: 'bg-accent-secondary/[0.05]', clip: 'polygon(50% 0%, 100% 40%, 70% 100%, 0% 65%)' },
    { top: '82%', left: '30%', size: 110, rotate: -22, tone: 'bg-foreground/[0.03]', clip: 'polygon(10% 0%, 100% 20%, 85% 100%, 0% 85%)' },
    { top: '2%', left: '38%', size: 80, rotate: 14, tone: 'bg-accent/[0.05]', clip: 'polygon(0% 0%, 100% 10%, 75% 100%, 15% 90%)' },
] as const;

/**
 * Shared decorative background: a faint animated grid, scattered low-poly
 * facets, and twinkling spark particles — the same texture as the team
 * crest's background art, at a fraction of the opacity. Purely
 * `pointer-events-none` chrome — safe behind any content.
 */
export function AmbientBackdrop() {
    return (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div
                className="animate-grid-pan absolute inset-0 opacity-[0.06]"
                style={{
                    backgroundImage:
                        'linear-gradient(var(--color-border) 1px, transparent 1px), linear-gradient(90deg, var(--color-border) 1px, transparent 1px)',
                    backgroundSize: '64px 64px',
                }}
            />

            {FACETS.map((facet, index) => (
                <div
                    key={index}
                    className={cn('absolute', facet.tone)}
                    style={{
                        top: facet.top,
                        left: facet.left,
                        width: facet.size,
                        height: facet.size,
                        transform: `rotate(${facet.rotate}deg)`,
                        clipPath: facet.clip,
                    }}
                />
            ))}

            {SPARKS.map((spark, index) => (
                <span
                    key={index}
                    className={cn('animate-twinkle absolute rounded-full', spark.tone)}
                    style={{
                        top: spark.top,
                        left: spark.left,
                        width: spark.size,
                        height: spark.size,
                        animationDuration: spark.duration,
                        animationDelay: spark.delay,
                    }}
                />
            ))}
        </div>
    );
}
