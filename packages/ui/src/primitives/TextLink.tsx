import { Link } from '@inertiajs/react';
import { ComponentProps } from 'react';

import { cn } from '../lib/cn';

type LinkProps = ComponentProps<typeof Link>;

export function TextLink({ className, children, ...props }: LinkProps) {
    return (
        <Link
            className={cn(
                'text-accent-secondary decoration-accent-secondary/40 hover:decoration-accent-secondary underline underline-offset-4 transition-colors',
                className,
            )}
            {...props}
        >
            {children}
        </Link>
    );
}
