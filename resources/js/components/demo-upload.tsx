import { DemoStatus, DemoStatusAction } from '@bucabull/ui';
import { Link, router } from '@inertiajs/react';
import { useState } from 'react';

import { type DemoRecord } from '@/types/demo';

export interface DemoUploadProps {
    /** The FaceitMatch id this upload is scoped to — see DemoController@store's {match} route param. */
    matchId: number;
    demo: DemoRecord | null;
}

/**
 * Wires DemoStatusAction (packages/ui, presentational only) up to the
 * actual upload request — the same split GrenadeForm/ScreenshotUpload
 * use: the library component only picks a file, this page-level
 * component owns the network call.
 *
 * Uses the imperative `router.post` rather than `useForm`, since a
 * single-file action button has no form state worth tracking beyond
 * "currently uploading" + progress, both kept in local state driven by
 * the visit's own callbacks.
 */
export function DemoUpload({ matchId, demo }: DemoUploadProps) {
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);

    function handleFileSelected(file: File) {
        setUploading(true);
        setProgress(0);

        router.post(
            route('team.demos.store', matchId),
            { demo: file },
            {
                forceFormData: true,
                onProgress: (event) => setProgress(event?.percentage ?? 0),
                onFinish: () => setUploading(false),
            },
        );
    }

    // A successful store() redirects straight to team.demos.show, so
    // 'uploading' only ever matters until that navigation lands — it's
    // not a status this page needs to persist anywhere.
    const status: DemoStatus = uploading ? 'uploading' : (demo?.status ?? 'none');

    return (
        <DemoStatusAction
            status={status}
            uploadProgress={progress}
            onFileSelected={handleFileSelected}
            watchHref={demo ? route('team.demos.show', demo.id) : undefined}
            linkAs={Link}
            errorMessage={demo?.error_message}
        />
    );
}
