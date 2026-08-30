import { PlayCircle } from 'lucide-react';
import { useRef, useState } from 'react';

import { cn } from '../lib/cn';

export interface VideoThumbnailProps {
    videoUrl?: string | null;
    /** Falls back to a derived YouTube thumbnail when the link is a YouTube video. */
    posterUrl?: string | null;
    className?: string;
}

const HOVER_DELAY_MS = 400;

// No API key needed — YouTube serves these thumbnails publicly for any
// video that exists. Other hosts just don't get a poster/preview.
function youtubeId(url: string): string | null {
    const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|v\/)|youtu\.be\/)([\w-]{11})/);
    return match?.[1] ?? null;
}

// controls=0 alone still leaves related-video suggestions, annotations, and
// keyboard shortcuts active — these strip the rest of YouTube's chrome for
// a clean preview-only embed.
function previewEmbedUrl(id: string): string {
    const params = new URLSearchParams({
        autoplay: '1',
        mute: '1',
        controls: '0',
        loop: '1',
        playlist: id,
        modestbranding: '1',
        playsinline: '1',
        rel: '0',
        iv_load_policy: '3',
        disablekb: '1',
        fs: '0',
        cc_load_policy: '0',
    });
    return `https://www.youtube.com/embed/${id}?${params}`;
}

/**
 * A clickable video thumbnail. After a short hover delay (only for YouTube
 * links, the only host this can derive an embeddable ID from), a muted
 * looping preview pops out at a larger size, growing from the thumbnail's
 * own position — that's what makes it work regardless of which row/column
 * of a grid the thumbnail happens to be in, without any viewport-edge
 * collision detection. The small thumbnail itself is unchanged underneath.
 * The popout iframe is pointer-events-none so hovering it still opens the
 * real video on click, same as the static thumbnail.
 *
 * The popout shows its poster image immediately (so hovering never feels
 * like it's staring at a blank/black box) and cross-fades to the actual
 * embed once the iframe reports itself loaded — YouTube's player takes a
 * beat to spin up, and this is the difference between that beat feeling
 * like a hang versus feeling instant.
 */
export function VideoThumbnail({ videoUrl, posterUrl, className }: VideoThumbnailProps) {
    const [hovering, setHovering] = useState(false);
    const [previewReady, setPreviewReady] = useState(false);
    const timeoutRef = useRef<number | undefined>(undefined);
    const embedId = videoUrl ? youtubeId(videoUrl) : null;
    const poster = posterUrl ?? (embedId ? `https://img.youtube.com/vi/${embedId}/hqdefault.jpg` : null);

    const media = poster ? (
        <img src={poster} alt="" className="aspect-video w-full rounded-md object-cover" />
    ) : (
        <div className="aspect-video w-full rounded-md bg-muted" />
    );

    if (!videoUrl) return media;

    function handleEnter() {
        timeoutRef.current = window.setTimeout(() => setHovering(true), HOVER_DELAY_MS);
    }

    function handleLeave() {
        window.clearTimeout(timeoutRef.current);
        setHovering(false);
        setPreviewReady(false);
    }

    return (
        <a
            href={videoUrl}
            target="_blank"
            rel="noreferrer"
            aria-label="Watch video"
            className={cn('relative block', className)}
            onMouseEnter={handleEnter}
            onMouseLeave={handleLeave}
        >
            <div className="relative overflow-hidden rounded-md">
                {media}
                <PlayCircle className="pointer-events-none absolute inset-0 m-auto size-8 text-white drop-shadow" />
            </div>

            {hovering && embedId && (
                <div className="absolute top-1/2 left-1/2 z-20 w-[30rem] max-w-[85vw] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-lg border border-border bg-black shadow-2xl">
                    <div className="relative aspect-video w-full">
                        {poster && <img src={poster} alt="" className="absolute inset-0 size-full object-cover" />}
                        <iframe
                            src={previewEmbedUrl(embedId)}
                            onLoad={() => setPreviewReady(true)}
                            className={cn(
                                'pointer-events-none absolute inset-0 size-full transition-opacity duration-300',
                                previewReady ? 'opacity-100' : 'opacity-0',
                            )}
                            allow="autoplay; encrypted-media"
                            title="Video preview"
                        />
                    </div>
                </div>
            )}
        </a>
    );
}
