import { ChevronDown } from 'lucide-react';
import { ReactNode } from 'react';

export interface DisclosureProps {
    title: ReactNode;
    defaultOpen?: boolean;
    children: ReactNode;
}

/** Native <details>/<summary> — free expand/collapse, no JS state to manage. */
export function Disclosure({ title, defaultOpen = true, children }: DisclosureProps) {
    return (
        <details open={defaultOpen} className="group rounded-lg border border-border">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-3 text-sm font-medium [&::-webkit-details-marker]:hidden">
                {title}
                <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
            </summary>
            <div className="border-t border-border p-4">{children}</div>
        </details>
    );
}
