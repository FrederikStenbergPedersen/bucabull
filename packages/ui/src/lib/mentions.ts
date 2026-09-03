// Shared token syntax between MentionTextarea (writes it) and MentionText
// (reads it): `@[Label](kind:id)` — e.g. `@[Player1](player:12)`,
// `#[Mid Smoke](utility:45)`, or `#[Smoke](type:smoke)`. `id` is a plain
// string, not necessarily numeric — a generic utility type has no database
// row, just its own slug. The label is stored inline so a token still reads
// fine as plain text (a DB dump, an API response) even without a renderer,
// but MentionText re-resolves it against live data by id where possible so
// a later rename shows up without editing the description.
const TOKEN_PATTERN = /([@#])\[([^\]]+)\]\((\w+):([^)]+)\)/g;

export interface MentionToken {
    trigger: string;
    label: string;
    kind: string;
    id: string;
}

export type MentionSegment = { type: 'text'; text: string } | { type: 'mention'; token: MentionToken };

export function parseMentionSegments(value: string): MentionSegment[] {
    const segments: MentionSegment[] = [];
    let lastIndex = 0;

    for (const match of value.matchAll(TOKEN_PATTERN)) {
        const [full, trigger, label, kind, id] = match;
        const index = match.index ?? 0;

        if (index > lastIndex) {
            segments.push({ type: 'text', text: value.slice(lastIndex, index) });
        }

        segments.push({ type: 'mention', token: { trigger, label, kind, id } });
        lastIndex = index + full.length;
    }

    if (lastIndex < value.length) {
        segments.push({ type: 'text', text: value.slice(lastIndex) });
    }

    return segments;
}

export function mentionToken(trigger: string, label: string, kind: string, id: string | number): string {
    return `${trigger}[${label}](${kind}:${id})`;
}

export interface ResolvedMention {
    label: string;
    /** If given, MentionText renders the chip as a link to this URL (e.g. the Utility page for the map a referenced lineup lives on). */
    href?: string;
    /** If given (and a YouTube link), MentionText shows a hover preview the same way VideoThumbnail does. */
    videoUrl?: string | null;
    /** Poster shown immediately on hover, before the video preview loads — or the whole preview if videoUrl isn't a YouTube link. */
    posterUrl?: string | null;
}

/**
 * Shared by MentionTextarea (renders chips for the value it's currently
 * editing) and MentionText (renders chips on a read view) — both need to
 * re-resolve a token's live label by id, falling back to the token's own
 * stored label if the id no longer resolves (e.g. it was deleted or
 * renamed). MentionTextarea only ever uses `label` (chips in the editor
 * aren't clickable/hoverable); `href`/`videoUrl`/`posterUrl` are for
 * MentionText's read view.
 */
export interface MentionResolver {
    kind: string;
    lookup: (id: string) => ResolvedMention | undefined;
}
