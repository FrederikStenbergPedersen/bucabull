import { SVGProps } from 'react';

/**
 * Hand-authored icons for the Grenades feature's niche fields (throw
 * button, stance, movement, jump, grenade type) — no free icon set has
 * these exact concepts. Throw button keeps the original mouse-with-pie-
 * fill design (a from-scratch mouse redesign read worse). Stance, movement,
 * and jump went through an abstracted "body capsule" pass first, but that
 * read as technically-distinct-but-not-actually-informative when scanning
 * a lineup card's recap row — real jointed stick figures (head + torso +
 * angled limbs) communicate the actual pose at a glance instead. One rig
 * throughout (same head radius, torso/leg length ratios, and bend style),
 * just re-posed or rescaled: standing/crouching changes leg bend and torso
 * height, walking/running leans the torso and drives one knee up into the
 * classic running-pictogram silhouette (a wider-spread-but-straight-legs
 * pass read as a static split, not a gait — two bent knees plus arms plus
 * speed-lines read as a gait but turned to mush at the ~20px this renders
 * at in a lineup card's recap row; one bent leg is the balance that
 * survives both, plus a trailing `>`/`>>` chevron for extra speed cueing),
 * and jump keeps the head/torso/arms pixel-identical to Stance-Standing
 * (an earlier pass shrunk the whole figure to leave room for it to travel
 * up off the ground, but any shrink reads as "a smaller person" — the fix
 * is to not move the figure at all) and only changes the legs: straight to
 * the ground line for "no jump", bent and tucked clear of it for
 * "jump-throw". The 4 grenade-type icons are
 * unrelated to this rig — outline canister + one filled top ornament.
 * 24x24 viewBox, bolder 2.5px stroke.
 */

type IconProps = SVGProps<SVGSVGElement>;

const base = {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2.5,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
};

// Mouse shell with the active button (or both) filled in, plus a click
// dot — unchanged from the first pass, which already read well.
export function ThrowLeftClickIcon(props: IconProps) {
    return (
        <svg {...base} {...props}>
            <rect x="5" y="2" width="14" height="20" rx="7" />
            <line x1="12" y1="2" x2="12" y2="10" />
            <circle cx="12" cy="14" r="1.4" fill="currentColor" stroke="none" />
            <path d="M6 10a6 6 0 0 1 6-8v8z" fill="currentColor" stroke="none" />
        </svg>
    );
}

export function ThrowRightClickIcon(props: IconProps) {
    return (
        <svg {...base} {...props}>
            <rect x="5" y="2" width="14" height="20" rx="7" />
            <line x1="12" y1="2" x2="12" y2="10" />
            <circle cx="12" cy="14" r="1.4" fill="currentColor" stroke="none" />
            <path d="M18 10a6 6 0 0 0-6-8v8z" fill="currentColor" stroke="none" />
        </svg>
    );
}

export function ThrowBothClickIcon(props: IconProps) {
    return (
        <svg {...base} {...props}>
            <rect x="5" y="2" width="14" height="20" rx="7" />
            <line x1="12" y1="2" x2="12" y2="10" />
            <circle cx="12" cy="14" r="1.4" fill="currentColor" stroke="none" />
            <path d="M6 10A6 6 0 0 1 12 2A6 6 0 0 1 18 10Z" fill="currentColor" stroke="none" />
        </svg>
    );
}

export function StanceStandingIcon(props: IconProps) {
    return (
        <svg {...base} {...props}>
            <line x1="4" y1="21" x2="20" y2="21" />
            <circle cx="12" cy="4" r="2.2" fill="currentColor" stroke="none" />
            <line x1="12" y1="6.2" x2="12" y2="14" />
            <line x1="12" y1="8" x2="8.8" y2="12.5" />
            <line x1="12" y1="8" x2="15.2" y2="12.5" />
            <line x1="12" y1="14" x2="10" y2="21" />
            <line x1="12" y1="14" x2="14" y2="21" />
        </svg>
    );
}

export function StanceCrouchingIcon(props: IconProps) {
    return (
        <svg {...base} {...props}>
            <line x1="4" y1="21" x2="20" y2="21" />
            <circle cx="12" cy="10.4" r="2.2" fill="currentColor" stroke="none" />
            <line x1="12" y1="12.6" x2="12" y2="16" />
            <line x1="12" y1="13.2" x2="8.6" y2="16.6" />
            <line x1="12" y1="13.2" x2="15.4" y2="16.6" />
            <path d="M12 16 L8.2 17.6 L8.8 21" fill="none" />
            <path d="M12 16 L15.8 17.6 L15.2 21" fill="none" />
        </svg>
    );
}

// Movement re-uses the Stance-standing figure exactly (no ground line, so
// it never gets confused for the Stance field despite the shared pose).
export function MovementStandingIcon(props: IconProps) {
    return (
        <svg {...base} {...props}>
            <circle cx="12" cy="4" r="2.2" fill="currentColor" stroke="none" />
            <line x1="12" y1="6.2" x2="12" y2="14" />
            <line x1="12" y1="8" x2="8.8" y2="12.5" />
            <line x1="12" y1="8" x2="15.2" y2="12.5" />
            <line x1="12" y1="14" x2="10" y2="21" />
            <line x1="12" y1="14" x2="14" y2="21" />
        </svg>
    );
}

// Walking/running need an actual bent front knee — wider-spread straight
// legs alone read as a static split, not a gait — but two bent knees plus
// arms plus speed-lines (an earlier pass) turned to mush at a real 20px
// render. One bent leg (the classic running-pictogram silhouette: front
// knee driven up, back leg trailing straight) plus straight arms keeps
// the element count close to Stance/Jump's and still reads small. A
// trailing `>`/`>>` chevron (the fast-forward convention) reinforces the
// speed reading on top of the pose — tucked into empty space below the
// trailing leg so it doesn't collide with the swung-forward arm.
export function MovementWalkingIcon(props: IconProps) {
    return (
        <svg {...base} {...props}>
            <circle cx="12.6" cy="4" r="2.2" fill="currentColor" stroke="none" />
            <line x1="12.6" y1="6.2" x2="11.8" y2="14" />
            <line x1="12.2" y1="7.9" x2="9" y2="12" />
            <line x1="12.2" y1="7.9" x2="15.8" y2="11.5" />
            <line x1="11.8" y1="14" x2="8.7" y2="20.5" />
            <path d="M11.8 14 L14.3 16.5 L13.5 21" fill="none" />
            <path d="M17.8 13.5 L20.3 16 L17.8 18.5" fill="none" />
        </svg>
    );
}

export function MovementRunningIcon(props: IconProps) {
    return (
        <svg {...base} {...props}>
            <circle cx="13.6" cy="3.4" r="2.2" fill="currentColor" stroke="none" />
            <line x1="13.4" y1="5.6" x2="11" y2="13" />
            <line x1="12.2" y1="7.3" x2="16.5" y2="9.5" />
            <line x1="12.2" y1="7.3" x2="7.3" y2="8.8" />
            <line x1="11" y1="13" x2="6" y2="19.5" />
            <path d="M11 13 L16 14.5 L14.5 19.5" fill="none" />
            <path d="M17.5 11.5 L20 14.5 L17.5 17.5" fill="none" />
            <path d="M20.9 11.5 L23.4 14.5 L20.9 17.5" fill="none" />
        </svg>
    );
}

// Jump was previously a shrunk copy of the rig, to leave room for the
// whole figure to physically move up off the ground — but any shrink at
// all reads as "a smaller person" next to Stance/Movement, which is the
// wrong trade. Head/torso/arms are pixel-identical to Stance-Standing here
// (nothing needs to travel), and only the legs change: straight to the
// ground line for "no jump", bent and tucked clear of it for "jump-throw".
export function JumpStandingIcon(props: IconProps) {
    return (
        <svg {...base} {...props}>
            <line x1="4" y1="21" x2="20" y2="21" />
            <circle cx="12" cy="4" r="2.2" fill="currentColor" stroke="none" />
            <line x1="12" y1="6.2" x2="12" y2="14" />
            <line x1="12" y1="8" x2="8.8" y2="12.5" />
            <line x1="12" y1="8" x2="15.2" y2="12.5" />
            <line x1="12" y1="14" x2="10" y2="21" />
            <line x1="12" y1="14" x2="14" y2="21" />
        </svg>
    );
}

// Every earlier attempt kept the front-facing Stance-Standing skeleton
// and only varied the legs (spread, tucked, dashed ground line, chevrons)
// — none of it read as "jumping" on its own merit, only as "not standing."
// This breaks from that entirely and adopts MovementRunning's leaning,
// side-on skeleton instead, going further: both arms bent into a pumping
// swing (not Running's straight splay) and both legs bent and tucked
// clear of the ground (not Running's one-planted-one-trailing stride) —
// every limb bent at once is what a runner's straight trailing leg
// doesn't give you, and what actually reads as "airborne, mid-leap" at a
// glance. No ground line or motion marks needed; the pose alone carries it.
export function JumpJumpingIcon(props: IconProps) {
    return (
        <svg {...base} {...props}>
            <circle cx="13.6" cy="3.4" r="2.2" fill="currentColor" stroke="none" />
            <line x1="13.4" y1="5.6" x2="11" y2="13" />
            <path d="M12.2 7.3 L9 6.3 L7.3 8.5" fill="none" />
            <path d="M12.2 7.3 L15.3 8.2 L16.8 6.5" fill="none" />
            <path d="M11 13 L7 13.5 L7.8 17.5" fill="none" />
            <path d="M11 13 L14.5 15 L13 18.5" fill="none" />
        </svg>
    );
}

export function TypeSmokeIcon(props: IconProps) {
    return (
        <svg {...base} {...props}>
            <rect x="8" y="12" width="8" height="9" rx="1.5" />
            <line x1="8" y1="14.5" x2="16" y2="14.5" />
            <line x1="8" y1="17.5" x2="16" y2="17.5" />
            <circle cx="8.8" cy="7.2" r="2.3" fill="currentColor" stroke="none" />
            <circle cx="12.6" cy="5.4" r="2.9" fill="currentColor" stroke="none" />
            <circle cx="16.1" cy="7.4" r="2.1" fill="currentColor" stroke="none" />
        </svg>
    );
}

export function TypeFlashIcon(props: IconProps) {
    return (
        <svg {...base} {...props}>
            <rect x="8" y="12" width="8" height="9" rx="1.5" />
            <line x1="8" y1="14.5" x2="16" y2="14.5" />
            <line x1="8" y1="17.5" x2="16" y2="17.5" />
            <path
                d="M12 1.5 L13.13 5.37 L17 6.5 L13.13 7.63 L12 11.5 L10.87 7.63 L7 6.5 L10.87 5.37 Z"
                fill="currentColor"
                stroke="none"
            />
        </svg>
    );
}

export function TypeGrenadeIcon(props: IconProps) {
    return (
        <svg {...base} {...props}>
            <circle cx="12" cy="14" r="7" />
            <line x1="12" y1="9" x2="12" y2="19" />
            <line x1="7" y1="14" x2="17" y2="14" />
            <path d="M9 7.2c0-2.2 1.4-3.6 3-3.6s3 1.4 3 3.6" />
            <circle cx="15.6" cy="3.6" r="1.6" />
        </svg>
    );
}

export function TypeMolotovIcon(props: IconProps) {
    return (
        <svg {...base} {...props}>
            <path d="M10 9V6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v3" />
            <path d="M9 9h6l1.5 4v6.5a2 2 0 0 1-2 2h-6a2 2 0 0 1-2-2V13z" />
            <line x1="8.3" y1="16" x2="15.7" y2="16" />
            <path
                d="M12 0.8c1.1 1.4 2.6 3 2.6 4.7a2.6 2.6 0 1 1-5.2 0c0-1.7 1.5-3.3 2.6-4.7z"
                fill="currentColor"
                stroke="none"
            />
        </svg>
    );
}
