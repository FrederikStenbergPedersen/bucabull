// Shared by VideoThumbnail (a card's own video) and MentionText (an inline
// mention chip's hover preview) — both need the same "how do we build a
// clean, chrome-free YouTube preview embed" logic, and having it in one
// place means a param tweak can't drift between the two.

// No API key needed — YouTube serves these thumbnails publicly for any
// video that exists. Other hosts just don't get a poster/preview.
export function youtubeId(url: string): string | null {
    const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|v\/)|youtu\.be\/)([\w-]{11})/);
    return match?.[1] ?? null;
}

// controls=0 alone still leaves related-video suggestions, annotations, and
// keyboard shortcuts active — these strip the rest of YouTube's chrome for
// a clean preview-only embed.
export function youtubePreviewEmbedUrl(id: string): string {
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
