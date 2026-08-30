import { RefObject, TransitionEvent, useEffect, useRef, useState } from 'react';

export interface NativeDialogState {
    dialogRef: RefObject<HTMLDialogElement | null>;
    mounted: boolean;
    closing: boolean;
    requestClose: () => void;
    handleCancel: (e: React.SyntheticEvent<HTMLDialogElement>) => void;
    handleBackdropClick: (e: React.MouseEvent<HTMLDialogElement>) => void;
    handleTransitionEnd: (e: TransitionEvent<HTMLDialogElement>) => void;
}

/**
 * Shared lifecycle behind every native-<dialog>-based modal in this
 * library (Drawer, Modal): open/close via showModal()/close(), a
 * JS-driven exit so the CSS transition gets to play before the element
 * actually unmounts, backdrop-click-to-close (only when the click target
 * IS the dialog, not something inside it), Escape routed through the
 * same exit animation instead of closing instantly, and a scroll lock for
 * the whole mounted lifetime (showModal() makes the page behind inert but
 * doesn't stop it scrolling under the dialog).
 */
export function useNativeDialog(open: boolean, onClose: () => void): NativeDialogState {
    const dialogRef = useRef<HTMLDialogElement>(null);
    const [mounted, setMounted] = useState(open);
    const [closing, setClosing] = useState(false);
    // Drawer animates one CSS property (translate); Modal animates two
    // (scale + opacity), which fires transitionend twice per close — this
    // guards handleTransitionEnd so the close-out logic (and onClose())
    // only ever runs once per close, regardless of how many properties
    // the caller's CSS transitions.
    const closeHandledRef = useRef(false);

    useEffect(() => {
        if (open) {
            setMounted(true);
            setClosing(false);
            closeHandledRef.current = false;
        } else if (mounted) {
            setClosing(true);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    useEffect(() => {
        if (!mounted) return;

        const dialog = dialogRef.current;
        if (dialog && !dialog.open) {
            dialog.showModal();
        }
    }, [mounted]);

    useEffect(() => {
        if (!mounted) return;

        const html = document.documentElement;
        const previousOverflow = html.style.overflow;
        html.style.overflow = 'hidden';
        return () => {
            html.style.overflow = previousOverflow;
        };
    }, [mounted]);

    function requestClose() {
        setClosing(true);
    }

    function handleTransitionEnd(e: TransitionEvent<HTMLDialogElement>) {
        if (e.target !== e.currentTarget) return;
        if (closing && !closeHandledRef.current) {
            closeHandledRef.current = true;
            dialogRef.current?.close();
            setMounted(false);
            setClosing(false);
            onClose();
        }
    }

    function handleCancel(e: React.SyntheticEvent<HTMLDialogElement>) {
        e.preventDefault();
        requestClose();
    }

    function handleBackdropClick(e: React.MouseEvent<HTMLDialogElement>) {
        if (e.target === dialogRef.current) {
            requestClose();
        }
    }

    return { dialogRef, mounted, closing, requestClose, handleCancel, handleBackdropClick, handleTransitionEnd };
}
