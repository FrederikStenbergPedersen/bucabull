import { ElementType, Fragment, useRef, useState } from 'react';

import { cn } from '../lib/cn';
import { type MentionResolver, parseMentionSegments } from '../lib/mentions';
import { youtubeId, youtubePreviewEmbedUrl } from '../lib/youtube';

export type { MentionResolver };

export interface MentionTextProps {
    value: string;
    resolvers?: MentionResolver[];
    /** Component to render a resolved mention's link as (e.g. Inertia's `Link`) — defaults to a plain `<a>`, which would do a full page load for an internal route. */
    linkAs?: ElementType;
    className?: string;
}

/** Read-view companion to MentionTextarea — parses the same `@[Label](kind:id)` token syntax and renders each as an inline chip. */
export function MentionText({ value, resolvers = [], linkAs = 'a', className }: MentionTextProps) {
    const segments = parseMentionSegments(value);

    return (
        <span className={cn('whitespace-pre-wrap', className)}>
            {segments.map((segment, i) => {
                if (segment.type === 'text') return <Fragment key={i}>{segment.text}</Fragment>;

                const resolver = resolvers.find((r) => r.kind === segment.token.kind);
                const resolved = resolver?.lookup(segment.token.id);

                return (
                    <MentionChip
                        key={i}
                        trigger={segment.token.trigger}
                        label={resolved?.label ?? segment.token.label}
                        href={resolved?.href}
                        videoUrl={resolved?.videoUrl}
                        posterUrl={resolved?.posterUrl}
                        linkAs={linkAs}
                    />
                );
            })}
        </span>
    );
}

const HOVER_DELAY_MS = 400;

const CHIP_CLASSES = 'bg-accent/10 text-accent-secondary rounded px-1 py-0.5 font-medium';

interface MentionChipProps {
    trigger: string;
    label: string;
    href?: string;
    videoUrl?: string | null;
    posterUrl?: string | null;
    linkAs: ElementType;
}

function MentionChip({ trigger, label, href, videoUrl, posterUrl, linkAs: LinkAs }: MentionChipProps) {
    const [hovering, setHovering] = useState(false);
    const [previewReady, setPreviewReady] = useState(false);
    const timeoutRef = useRef<number | undefined>(undefined);

    const embedId = videoUrl ? youtubeId(videoUrl) : null;
    const poster = posterUrl ?? (embedId ? `https://img.youtube.com/vi/${embedId}/hqdefault.jpg` : null);
    const previewable = Boolean(poster);

    function handleEnter() {
        if (!previewable) return;
        timeoutRef.current = window.setTimeout(() => setHovering(true), HOVER_DELAY_MS);
    }

    function handleLeave() {
        window.clearTimeout(timeoutRef.current);
        setHovering(false);
        setPreviewReady(false);
    }

    const content = (
        <span className={CHIP_CLASSES}>
            {trigger}
            {label}
        </span>
    );

    if (!href) {
        // Not every kind resolves to a page to link to (e.g. a generic
        // "#Smoke" type mention) — those stay plain, non-interactive text.
        return previewable ? (
            <span className="relative inline-block" onMouseEnter={handleEnter} onMouseLeave={handleLeave}>
                {content}
                {hovering && <MentionPreview poster={poster} embedId={embedId} previewReady={previewReady} onPreviewReady={setPreviewReady} />}
            </span>
        ) : (
            content
        );
    }

    return (
        <span className="relative inline-block" onMouseEnter={handleEnter} onMouseLeave={handleLeave}>
            <LinkAs href={href} className={cn(CHIP_CLASSES, 'cursor-pointer hover:underline')}>
                {trigger}
                {label}
            </LinkAs>
            {hovering && <MentionPreview poster={poster} embedId={embedId} previewReady={previewReady} onPreviewReady={setPreviewReady} />}
        </span>
    );
}

/**
 * Same hover-preview mechanic as VideoThumbnail (poster shown immediately,
 * cross-fading to the live embed once it loads) — anchored above an inline
 * text chip instead of growing from a block-level thumbnail, since a
 * mention lives inside running prose.
 */
function MentionPreview({
    poster,
    embedId,
    previewReady,
    onPreviewReady,
}: {
    poster: string | null;
    embedId: string | null;
    previewReady: boolean;
    onPreviewReady: (ready: boolean) => void;
}) {
    return (
        <span className="border-border bg-card absolute bottom-full left-1/2 z-30 mb-1 block w-80 max-w-[85vw] -translate-x-1/2 overflow-hidden rounded-md border shadow-lg">
            <span className="relative block aspect-video w-full">
                {poster && <img src={poster} alt="" className="absolute inset-0 size-full object-cover" />}
                {embedId && (
                    <iframe
                        src={youtubePreviewEmbedUrl(embedId)}
                        onLoad={() => onPreviewReady(true)}
                        className={cn(
                            'pointer-events-none absolute inset-0 size-full transition-opacity duration-300',
                            previewReady ? 'opacity-100' : 'opacity-0',
                        )}
                        allow="autoplay; encrypted-media"
                        title="Video preview"
                    />
                )}
            </span>
        </span>
    );
}
