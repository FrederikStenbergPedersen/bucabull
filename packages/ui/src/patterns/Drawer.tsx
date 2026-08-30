import { X } from 'lucide-react';
import { ReactNode } from 'react';

import { useNativeDialog } from '../lib/use-native-dialog';
import { Button } from '../primitives/Button';
import { Text } from '../primitives/Text';

export interface DrawerProps {
    open: boolean;
    onClose: () => void;
    title: string;
    children: ReactNode;
}

/**
 * Right-side slide-over built on native <dialog> (see useNativeDialog for
 * the open/close/backdrop/transition mechanics shared with Modal). The
 * enter transition is CSS-only via @starting-style on the dialog's own
 * [open] attribute (see theme.css) — that's the part that has to live on
 * the <dialog> element itself, not a child div.
 */
export function Drawer({ open, onClose, title, children }: DrawerProps) {
    const { dialogRef, mounted, closing, requestClose, handleCancel, handleBackdropClick, handleTransitionEnd } = useNativeDialog(open, onClose);

    if (!mounted) return null;

    return (
        <dialog
            ref={dialogRef}
            data-closing={closing}
            onCancel={handleCancel}
            onClick={handleBackdropClick}
            onTransitionEnd={handleTransitionEnd}
            className="drawer-panel fixed inset-y-0 left-auto right-0 m-0 flex h-full w-full max-w-md flex-col overflow-hidden border-0 bg-card p-0 text-foreground shadow-2xl [&::backdrop]:bg-black/50"
        >
            <div className="flex items-center justify-between border-b border-border p-4">
                <Text variant="subheading">{title}</Text>
                <Button type="button" variant="ghost" size="icon" onClick={requestClose} aria-label="Close">
                    <X className="size-4" />
                </Button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">{children}</div>
        </dialog>
    );
}
