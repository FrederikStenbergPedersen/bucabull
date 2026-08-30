import { ReactNode } from 'react';

import { useNativeDialog } from '../lib/use-native-dialog';
import { cn } from '../lib/cn';

export interface ModalProps {
    open: boolean;
    onClose: () => void;
    children: ReactNode;
    className?: string;
}

/**
 * Centered popup, same native-<dialog> mechanics as Drawer (see
 * useNativeDialog) but scale+fade instead of slide-from-side — for
 * content that isn't a full side panel (confirmations, short prompts).
 * No built-in header/title: unlike Drawer this is meant to wrap small,
 * varied content (see ConfirmDialog), so the chrome lives with the
 * caller instead of being imposed here.
 */
export function Modal({ open, onClose, children, className }: ModalProps) {
    const { dialogRef, mounted, closing, handleCancel, handleBackdropClick, handleTransitionEnd } = useNativeDialog(open, onClose);

    if (!mounted) return null;

    return (
        <dialog
            ref={dialogRef}
            data-closing={closing}
            onCancel={handleCancel}
            onClick={handleBackdropClick}
            onTransitionEnd={handleTransitionEnd}
            className={cn(
                'modal-panel m-auto max-w-sm rounded-2xl border-0 bg-card p-0 text-foreground shadow-2xl [&::backdrop]:bg-black/50',
                className,
            )}
        >
            {children}
        </dialog>
    );
}
