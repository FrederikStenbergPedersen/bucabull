import { X } from 'lucide-react';

import { Button } from '../primitives/Button';

export interface RemovableThumbnailProps {
    src: string;
    onRemove: () => void;
    disabled?: boolean;
}

/** A single removable image thumbnail — doesn't care whether `src` is a local object URL or a server URL. */
export function RemovableThumbnail({ src, onRemove, disabled }: RemovableThumbnailProps) {
    return (
        <div className="relative size-20 overflow-hidden rounded-md border border-border">
            <img src={src} alt="" className="size-full object-cover" />
            <Button
                type="button"
                variant="secondary"
                size="icon"
                onClick={onRemove}
                disabled={disabled}
                className="absolute top-1 right-1 size-6 bg-background/80"
                aria-label="Remove screenshot"
            >
                <X className="size-3.5" />
            </Button>
        </div>
    );
}
