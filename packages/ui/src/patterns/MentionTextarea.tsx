import { ClipboardEvent, KeyboardEvent, ReactNode, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { cn } from '../lib/cn';
import { type MentionResolver, mentionToken, parseMentionSegments } from '../lib/mentions';

export interface MentionItem {
    id: string | number;
    kind: string;
    label: string;
    sublabel?: string;
    /** A small vector icon (e.g. a fixed utility-type glyph). */
    icon?: ReactNode;
}

export interface MentionSection {
    heading: string;
    items: MentionItem[];
}

export interface MentionTrigger {
    char: string;
    sections: MentionSection[];
}

export interface MentionTextareaProps {
    id?: string;
    value: string;
    onChange: (value: string) => void;
    triggers: MentionTrigger[];
    /** Resolves a mention's live label for display while editing — same shape MentionText takes for the read view. Falls back to the token's stored label when a resolver isn't given or doesn't find a match. */
    resolvers?: MentionResolver[];
    rows?: number;
    placeholder?: string;
    className?: string;
}

interface ActiveMatch {
    trigger: MentionTrigger;
    query: string;
    /** The text node the trigger char + query currently live in, and the offset within it where the trigger char starts. */
    node: Text;
    start: number;
}

const CHIP_DATA_KIND = 'mentionKind';
const CHIP_DATA_ID = 'mentionId';
const CHIP_DATA_TRIGGER = 'mentionTrigger';
const CHIP_DATA_LABEL = 'mentionLabel';

function isChipElement(node: Node | null): node is HTMLElement {
    return !!node && node.nodeType === Node.ELEMENT_NODE && CHIP_DATA_KIND in (node as HTMLElement).dataset;
}

function buildChipNode(trigger: string, kind: string, id: string, label: string): HTMLSpanElement {
    const span = document.createElement('span');
    span.contentEditable = 'false';
    span.dataset[CHIP_DATA_TRIGGER] = trigger;
    span.dataset[CHIP_DATA_KIND] = kind;
    span.dataset[CHIP_DATA_ID] = id;
    span.dataset[CHIP_DATA_LABEL] = label;
    span.className = 'rounded bg-accent/10 px-1 py-0.5 font-medium text-accent-secondary select-none';
    span.textContent = `${trigger}${label}`;
    return span;
}

/** Walks the editor's DOM back into the same `@[Label](kind:id)` string MentionText/the backend expect — the DOM is just a friendlier view over that same plain-text format, not a different storage model. */
function serializeEditor(container: HTMLElement): string {
    let out = '';
    container.childNodes.forEach((node) => {
        if (node.nodeType === Node.TEXT_NODE) {
            out += node.textContent ?? '';
        } else if (isChipElement(node)) {
            const d = node.dataset;
            out += mentionToken(d[CHIP_DATA_TRIGGER] ?? '', d[CHIP_DATA_LABEL] ?? '', d[CHIP_DATA_KIND] ?? '', d[CHIP_DATA_ID] ?? '');
        }
    });
    return out;
}

/** Rebuilds the editor's DOM from a plain value string, resolving each mention's current label via `resolvers` where possible (falls back to the token's own stored label). */
function renderValueIntoEditor(container: HTMLElement, value: string, resolvers: MentionResolver[]): void {
    container.textContent = '';
    for (const segment of parseMentionSegments(value)) {
        if (segment.type === 'text') {
            container.appendChild(document.createTextNode(segment.text));
            continue;
        }

        const resolver = resolvers.find((r) => r.kind === segment.token.kind);
        const resolved = resolver?.lookup(segment.token.id);
        container.appendChild(buildChipNode(segment.token.trigger, segment.token.kind, segment.token.id, resolved?.label ?? segment.token.label));
    }
}

function findActiveMatch(triggers: MentionTrigger[], text: string, caret: number, node: Text): ActiveMatch | null {
    if (triggers.length === 0) return null;

    const chars = triggers.map((t) => t.char.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('');
    const pattern = new RegExp(`(?:^|\\s)([${chars}])([^\\s${chars}]*)$`);
    const match = text.slice(0, caret).match(pattern);
    if (!match) return null;

    const [, triggerChar, query] = match;
    const found = triggers.find((t) => t.char === triggerChar);
    if (!found) return null;

    return { trigger: found, query, node, start: caret - (1 + query.length) };
}

interface DropdownPosition {
    mode: 'absolute' | 'fixed';
    top: number;
    left: number;
    width: number;
    maxHeight: number;
}

const GAP = 4;
const PREFERRED_MAX_HEIGHT = 320;
const MIN_USABLE_HEIGHT = 120;

/**
 * Where to render the dropdown, and how to position/size it. A plain
 * `position: fixed` portal to document.body would be enough on its own,
 * except this form usually lives inside a Drawer/Modal — those are native
 * <dialog> elements opened with showModal(), which promotes them to the
 * browser's top layer, above the normal document (including anything
 * appended to body with a high z-index). So a body-portaled dropdown would
 * render *behind* the dialog. Portaling into the dialog itself avoids that,
 * but then `position: fixed` no longer means "relative to the viewport" —
 * the dialog's own slide/scale-in transition sets a `translate`/`scale` CSS
 * property, and any of those establish a new containing block for fixed
 * descendants. `position: absolute` relative to the dialog's own box,
 * computed by hand from the two bounding rects, sidesteps that ambiguity
 * entirely instead of relying on fixed-position semantics inside it.
 *
 * The dropdown can grow tall (a reference photo plus several numbered
 * items) — if the editor sits low in the form, opening straight down with
 * a fixed max-height would push most of it below the visible area with no
 * way to scroll it into view (it's positioned, not part of normal document
 * flow, so page/container scrolling doesn't reach it). So this picks
 * whichever side (below or above the editor) has more room, then caps the
 * height to whatever actually fits there — its own internal scrollbar
 * handles the rest.
 */
function resolveDropdownAnchor(anchorEl: HTMLElement): { target: Element; position: DropdownPosition } {
    const rect = anchorEl.getBoundingClientRect();
    const dialog = anchorEl.closest('dialog');
    const bounds = dialog ? dialog.getBoundingClientRect() : { top: 0, bottom: window.innerHeight, left: 0 };

    const spaceBelow = bounds.bottom - rect.bottom - GAP;
    const spaceAbove = rect.top - bounds.top - GAP;
    const openUpward = spaceBelow < MIN_USABLE_HEIGHT && spaceAbove > spaceBelow;
    const maxHeight = Math.max(Math.min(PREFERRED_MAX_HEIGHT, openUpward ? spaceAbove : spaceBelow), MIN_USABLE_HEIGHT);

    const top = openUpward ? rect.top - bounds.top - maxHeight - GAP : rect.bottom - bounds.top + GAP;
    const left = rect.left - bounds.left;

    if (dialog) {
        return { target: dialog, position: { mode: 'absolute', top, left, width: rect.width, maxHeight } };
    }

    return { target: document.body, position: { mode: 'fixed', top, left, width: rect.width, maxHeight } };
}

/**
 * A `contentEditable` box with `@`/`#`-style mention autocomplete: typing a
 * configured trigger character opens a dropdown of matching items (grouped
 * into sections), and picking one inserts an atomic, non-editable chip —
 * rendered as its resolved label only (e.g. "@Player1"), never the
 * `@[Player1](player:12)` storage syntax that MentionText/the backend see.
 * That underlying string is still exactly what gets read from and written
 * to `value` (see serializeEditor/renderValueIntoEditor) — this component
 * is just a friendlier *view* over the same plain-text format, not a
 * different one.
 *
 * The DOM here is edited directly (native contentEditable typing, and
 * direct node manipulation for chip insertion) rather than driven by React
 * re-rendering `value` into children every keystroke — that would fight
 * the browser's own cursor/selection handling. `value` is only pushed back
 * into the DOM when it changes for a reason *other* than our own typing
 * (e.g. switching which strategy is being edited) — see the sync effect.
 *
 * The dropdown is anchored below (or above, see resolveDropdownAnchor) the
 * editor as a whole rather than at the exact caret pixel position (which
 * would need a hidden-mirror-div measurement trick) — simpler and more
 * robust, at the cost of not tracking the caret when it's on an earlier
 * line of a multi-line value. It's rendered through a portal so a
 * scrollable ancestor (e.g. a Drawer's content area) can't clip it.
 */
export function MentionTextarea({ id, value, onChange, triggers, resolvers = [], rows = 4, placeholder, className }: MentionTextareaProps) {
    const editorRef = useRef<HTMLDivElement>(null);
    const [active, setActive] = useState<ActiveMatch | null>(null);
    const [highlightedIndex, setHighlightedIndex] = useState(0);
    const [anchor, setAnchor] = useState<{ target: Element; position: DropdownPosition } | null>(null);

    const activeSections = useMemo(() => {
        if (!active) return [];

        const query = active.query.toLowerCase();

        return active.trigger.sections
            .map((section) => {
                // A query matching the section's own heading (e.g. "#CT" for
                // a "CT Spawns" section) pulls in all of that section's
                // items unfiltered — their own labels ("Spawn 1") don't
                // repeat the heading, so filtering only by item label would
                // make the group unreachable by its own name.
                const headingMatches = section.heading.toLowerCase().includes(query);
                return {
                    ...section,
                    items: headingMatches ? section.items : section.items.filter((item) => item.label.toLowerCase().includes(query)),
                };
            })
            .filter((section) => section.items.length > 0);
    }, [active]);

    const flatItems = useMemo(() => activeSections.flatMap((section) => section.items), [activeSections]);

    // Keep the editor's DOM in sync with `value`, but only rebuild it when
    // `value` changed for a reason other than our own typing (our own edits
    // already leave the DOM serializing to exactly `value`, so rebuilding
    // then would just be destructive — it'd blow away the live cursor
    // position for no reason).
    useLayoutEffect(() => {
        const el = editorRef.current;
        if (!el) return;
        if (serializeEditor(el) === value) return;
        renderValueIntoEditor(el, value, resolvers);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value]);

    useLayoutEffect(() => {
        if (!active || !editorRef.current) {
            setAnchor(null);
            return;
        }

        const el = editorRef.current;
        const update = () => setAnchor(resolveDropdownAnchor(el));
        update();

        // Capture phase: a scroll inside a Drawer's own content area (or any
        // scrollable ancestor) doesn't bubble, but capture still sees it.
        window.addEventListener('scroll', update, true);
        window.addEventListener('resize', update);
        return () => {
            window.removeEventListener('scroll', update, true);
            window.removeEventListener('resize', update);
        };
    }, [active]);

    function syncFromSelection() {
        const selection = window.getSelection();
        const node = selection?.anchorNode;

        if (!node || node.nodeType !== Node.TEXT_NODE || !editorRef.current?.contains(node)) {
            setActive(null);
            return;
        }

        const match = findActiveMatch(triggers, node.textContent ?? '', selection!.anchorOffset, node as Text);
        setActive(match);
        setHighlightedIndex(0);
    }

    function insert(item: MentionItem) {
        const el = editorRef.current;
        if (!active || !el) return;

        const { node, start, query } = active;
        const end = start + 1 + query.length;

        const range = document.createRange();
        range.setStart(node, start);
        range.setEnd(node, Math.min(end, node.length));
        range.deleteContents();

        const point = range.startContainer;
        const offset = range.startOffset;
        let parent: Node;
        let refNode: Node | null;

        if (point.nodeType === Node.TEXT_NODE) {
            refNode = (point as Text).splitText(offset);
            parent = point.parentNode!;
        } else {
            parent = point;
            refNode = point.childNodes[offset] ?? null;
        }

        const chip = buildChipNode(active.trigger.char, item.kind, String(item.id), item.label);
        const space = document.createTextNode(' ');
        parent.insertBefore(chip, refNode);
        parent.insertBefore(space, refNode);

        const selection = window.getSelection();
        const newRange = document.createRange();
        newRange.setStartAfter(space);
        newRange.collapse(true);
        selection?.removeAllRanges();
        selection?.addRange(newRange);

        setActive(null);
        onChange(serializeEditor(el));
    }

    function handleInput() {
        if (!editorRef.current) return;
        onChange(serializeEditor(editorRef.current));
        syncFromSelection();
    }

    function handlePaste(e: ClipboardEvent<HTMLDivElement>) {
        e.preventDefault();
        const text = e.clipboardData.getData('text/plain');
        const selection = window.getSelection();
        if (!selection?.rangeCount) return;

        const range = selection.getRangeAt(0);
        range.deleteContents();
        const textNode = document.createTextNode(text);
        range.insertNode(textNode);
        range.setStartAfter(textNode);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);

        handleInput();
    }

    function handleKeyDown(e: KeyboardEvent<HTMLDivElement>) {
        if (active) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setHighlightedIndex((i) => Math.min(i + 1, Math.max(flatItems.length - 1, 0)));
                return;
            }
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                setHighlightedIndex((i) => Math.max(i - 1, 0));
                return;
            }
            if (e.key === 'Enter' || e.key === 'Tab') {
                const item = flatItems[highlightedIndex];
                if (item) {
                    e.preventDefault();
                    insert(item);
                }
                return;
            }
            if (e.key === 'Escape') {
                setActive(null);
                return;
            }
        }

        // Safety net for Backspace right after a chip — most browsers already
        // delete a contenteditable="false" element as one atomic unit when
        // the caret sits immediately after it, but this guarantees it rather
        // than risking the caret instead landing "inside" the chip.
        if (e.key === 'Backspace') {
            const selection = window.getSelection();
            if (selection?.isCollapsed && selection.anchorNode?.nodeType === Node.TEXT_NODE && selection.anchorOffset === 0) {
                const prev = selection.anchorNode.previousSibling;
                if (isChipElement(prev)) {
                    e.preventDefault();
                    prev.remove();
                    handleInput();
                }
            }
        }
    }

    return (
        <div className="relative">
            <div
                ref={editorRef}
                id={id}
                role="textbox"
                aria-multiline="true"
                data-placeholder={placeholder}
                contentEditable
                suppressContentEditableWarning
                style={{ minHeight: `${rows * 1.5}em` }}
                className={cn(
                    'border-input bg-card text-foreground empty:before:text-muted-foreground w-full rounded-md border px-3 py-2 text-sm whitespace-pre-wrap',
                    'empty:before:content-[attr(data-placeholder)]',
                    'focus-visible:ring-ring focus-visible:ring-offset-background focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
                    className,
                )}
                onInput={handleInput}
                onPaste={handlePaste}
                onClick={() => syncFromSelection()}
                onKeyUp={(e) => {
                    if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) syncFromSelection();
                }}
                onKeyDown={handleKeyDown}
                onBlur={() => setActive(null)}
            />

            {activeSections.length > 0 &&
                anchor &&
                createPortal(
                    <div
                        style={{
                            position: anchor.position.mode,
                            top: anchor.position.top,
                            left: anchor.position.left,
                            width: anchor.position.width,
                            maxHeight: anchor.position.maxHeight,
                        }}
                        className="border-border bg-card z-30 max-w-xs overflow-y-auto rounded-md border shadow-lg"
                    >
                        {activeSections.map((section) => (
                            <div key={section.heading}>
                                <div className="text-muted-foreground px-3 pt-2 pb-1 text-xs font-medium">{section.heading}</div>
                                {section.items.map((item) => (
                                    <button
                                        key={`${item.kind}-${item.id}`}
                                        type="button"
                                        onMouseDown={(e) => e.preventDefault()}
                                        onClick={() => insert(item)}
                                        className={cn(
                                            'flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm',
                                            flatItems[highlightedIndex] === item ? 'bg-accent/10' : 'hover:bg-muted/60',
                                        )}
                                    >
                                        {item.icon}
                                        <span className="flex flex-col">
                                            <span>{item.label}</span>
                                            {item.sublabel && <span className="text-muted-foreground text-xs">{item.sublabel}</span>}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        ))}
                    </div>,
                    anchor.target,
                )}
        </div>
    );
}
