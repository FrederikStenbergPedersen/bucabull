import { Button } from '../primitives/Button';
import { Text } from '../primitives/Text';
import { Modal } from './Modal';

export interface ConfirmDialogProps {
    open: boolean;
    onCancel: () => void;
    onConfirm: () => void;
    title: string;
    description?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    destructive?: boolean;
}

/**
 * Replaces window.confirm() for actions that need our own styling
 * (delete, etc.) — built on Modal rather than duplicating its dialog
 * chrome. Cancel/Confirm call straight back into the caller's own
 * `open` state instead of an internal close mechanism (see Modal) —
 * flipping that state to false is what plays the exit animation.
 */
export function ConfirmDialog({
    open,
    onCancel,
    onConfirm,
    title,
    description,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    destructive = false,
}: ConfirmDialogProps) {
    return (
        <Modal open={open} onClose={onCancel}>
            <div className="flex flex-col gap-4 p-5">
                <div className="flex flex-col gap-1">
                    <Text variant="subheading">{title}</Text>
                    {description && <Text variant="muted">{description}</Text>}
                </div>
                <div className="flex justify-end gap-2">
                    <Button type="button" variant="secondary" onClick={onCancel}>
                        {cancelLabel}
                    </Button>
                    <Button type="button" variant={destructive ? 'destructive' : 'primary'} onClick={onConfirm}>
                        {confirmLabel}
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
