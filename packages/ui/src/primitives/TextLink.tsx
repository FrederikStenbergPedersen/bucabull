import { Link } from '@inertiajs/react';
import { ComponentProps } from 'react';

import { cn } from '../lib/cn';

type LinkProps = ComponentProps<typeof Link>;

export function TextLink({ className, children, ...props }: LinkProps) {
    return (
        <Link
            className={cn('text-accent underline decoration-accent/40 underline-offset-4 transition-colors hover:decoration-accent', className)}
            {...props}
        >
            {children}
        </Link>
    );
}
