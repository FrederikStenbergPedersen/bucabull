import { ChangeEvent, ElementType, useRef } from 'react';

import { Button } from '../primitives/Button';
import { ProgressBar } from '../primitives/ProgressBar';
import { Text } from '../primitives/Text';

export type DemoStatus = 'none' | 'uploading' | 'processing' | 'ready' | 'failed';

export interface DemoStatusActionProps {
    status: DemoStatus;
    /** 0-100, shown while status === 'uploading'. */
    uploadProgress?: number;
    /**
     * Called with the picked file — this component only picks the file,
     * it never touches the network. The page owns the actual upload
     * request (progress events, the redirect once it lands, error
     * handling), the same split GrenadeForm/ScreenshotUpload already use.
     */
    onFileSelected: (file: File) => void;
    /** team.demos.show link, once status === 'ready'. */
    watchHref?: string;
    /** Injects Inertia's `Link` (or another router component) — keeps this package framework-agnostic, same as LinkableCard. */
    linkAs?: ElementType;
    errorMessage?: string | null;
}

/** Lives in a MatchCard's footer slot — walks a demo through upload → processing → ready/failed without MatchCard itself knowing anything about demos. */
export function DemoStatusAction({
    status,
    uploadProgress = 0,
    onFileSelected,
    watchHref,
    linkAs: LinkAs = 'a',
    errorMessage,
}: DemoStatusActionProps) {
    const inputRef = useRef<HTMLInputElement>(null);

    function handleChange(event: ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0];
        event.target.value = '';
        if (file) onFileSelected(file);
    }

    const fileInput = <input ref={inputRef} type="file" accept=".dem" hidden onChange={handleChange} />;

    if (status === 'uploading') {
        return (
            <div className="flex items-center gap-2">
                <ProgressBar value={uploadProgress} className="max-w-40" />
                <Text variant="muted">{Math.round(uploadProgress)}%</Text>
            </div>
        );
    }

    if (status === 'processing') {
        return <Text variant="muted">Parsing demo…</Text>;
    }

    if (status === 'ready') {
        return (
            <LinkAs href={watchHref}>
                <Button variant="secondary" size="sm">
                    Watch replay
                </Button>
            </LinkAs>
        );
    }

    return (
        <div className="flex items-center gap-2">
            {status === 'failed' && errorMessage && (
                <Text variant="muted" className="text-destructive">
                    {errorMessage}
                </Text>
            )}
            <Button variant="secondary" size="sm" onClick={() => inputRef.current?.click()}>
                {status === 'failed' ? 'Retry upload' : 'Upload demo'}
            </Button>
            {fileInput}
        </div>
    );
}
