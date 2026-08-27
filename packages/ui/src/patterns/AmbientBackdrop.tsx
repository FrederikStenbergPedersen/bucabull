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

/**
 * Shared decorative background: layered drifting glow, a faint animated
 * grid (echoes the team crest's cyber-grid texture), and twinkling spark
 * particles. Purely `pointer-events-none` chrome — safe behind any content.
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

            <div className="animate-drift-a absolute -top-40 -left-40 h-96 w-96 rounded-full bg-accent/25 blur-3xl" />
            <div className="animate-drift-b absolute -top-24 right-0 h-80 w-80 rounded-full bg-accent-secondary/20 blur-3xl" />
            <div className="animate-drift-c absolute top-1/3 left-1/2 h-72 w-72 rounded-full bg-accent-secondary/10 blur-3xl" />

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

            <div
                className="absolute inset-0"
                style={{
                    background: 'radial-gradient(ellipse at center, transparent 35%, var(--color-background) 92%)',
                }}
            />
        </div>
    );
}
