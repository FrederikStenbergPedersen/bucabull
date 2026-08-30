import {
    Badge,
    Button,
    Card,
    ConfirmDialog,
    Disclosure,
    Drawer,
    EmptySlotCard,
    Input,
    JumpJumpingIcon,
    JumpStandingIcon,
    MovementRunningIcon,
    MovementStandingIcon,
    MovementWalkingIcon,
    SegmentedControl,
    type SegmentedControlOption,
    SidebarNavItem,
    StanceCrouchingIcon,
    StanceStandingIcon,
    TeamLayout,
    Text,
    ThrowBothClickIcon,
    ThrowLeftClickIcon,
    ThrowRightClickIcon,
    TypeFlashIcon,
    TypeGrenadeIcon,
    TypeMolotovIcon,
    TypeSmokeIcon,
    VideoThumbnail,
} from '@bucabull/ui';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { Pencil, Trash2 } from 'lucide-react';
import { MouseEvent, useEffect, useState } from 'react';

import { GrenadeForm, SIDE_DOT } from '@/components/grenade-form';
import { useTeamNav } from '@/hooks/use-team-nav';
import { type SharedData } from '@/types';

interface MapEntry {
    slug: string;
    name: string;
    overview: string | null;
    count: number;
}

interface Screenshot {
    id: number;
    url: string;
}

interface GrenadeEntry {
    id: number;
    map: string;
    name: string;
    setpos: string;
    description: string | null;
    video_link: string | null;
    side: string;
    throw_button: string;
    stance: string;
    movement: string;
    jump: string;
    type: string;
    screenshots: Screenshot[];
}

interface SelectedMap {
    slug: string;
    name: string;
    overview: string | null;
}

interface IndexProps {
    maps: MapEntry[];
    customMaps: MapEntry[];
    selectedMap: SelectedMap | null;
    grenades: GrenadeEntry[];
}

type DrawerState = { mode: 'create'; prefillMap?: string } | { mode: 'edit'; grenade: GrenadeEntry } | null;

// A map can hold up to ~100 utilities, so they're grouped by type into
// collapsible sections (a flat list doesn't scale) with a compact grid
// inside each — not the roster-style one-row-per-item card.
const TYPES = [
    { value: 'smoke', label: 'Smoke', Icon: TypeSmokeIcon },
    { value: 'flash', label: 'Flash', Icon: TypeFlashIcon },
    { value: 'grenade', label: 'Grenade', Icon: TypeGrenadeIcon },
    { value: 'molotov', label: 'Molotov', Icon: TypeMolotovIcon },
] as const;

// Side is the parent filter above type — this is how utility is actually
// looked up in practice (which side you're on, then which type you need) —
// so it narrows `grenades` before the type grouping below ever sees it.
type SideFilter = 'all' | 'CT' | 'T';

const SIDE_FILTERS: SegmentedControlOption<SideFilter>[] = [
    { value: 'all', label: 'All' },
    { value: 'CT', label: 'CT', icon: <span className={`size-4 rounded-full ${SIDE_DOT.CT}`} /> },
    { value: 'T', label: 'T', icon: <span className={`size-4 rounded-full ${SIDE_DOT.T}`} /> },
];

// One icon + label per throw attribute so a card can show all four at a
// glance instead of a truncated "left · crouching" string that silently
// drops movement/jump — the exact combination is the whole point of a
// lineup (e.g. "left click, crouch, walk, jump" vs "left click, stand").
const THROW_BUTTON_META: Record<string, { Icon: typeof ThrowLeftClickIcon; label: string }> = {
    left: { Icon: ThrowLeftClickIcon, label: 'Left click' },
    right: { Icon: ThrowRightClickIcon, label: 'Right click' },
    both: { Icon: ThrowBothClickIcon, label: 'Both clicks' },
};

const STANCE_META: Record<string, { Icon: typeof StanceStandingIcon; label: string }> = {
    standing: { Icon: StanceStandingIcon, label: 'Standing' },
    crouching: { Icon: StanceCrouchingIcon, label: 'Crouching' },
};

const MOVEMENT_META: Record<string, { Icon: typeof MovementStandingIcon; label: string }> = {
    standing: { Icon: MovementStandingIcon, label: 'Stationary' },
    walking: { Icon: MovementWalkingIcon, label: 'Walking' },
    running: { Icon: MovementRunningIcon, label: 'Running' },
};

const JUMP_META: Record<string, { Icon: typeof JumpStandingIcon; label: string }> = {
    standing: { Icon: JumpStandingIcon, label: 'No jump' },
    jumping: { Icon: JumpJumpingIcon, label: 'Jump-throw' },
};

// Drawer open/edit state lives in the URL (?drawer=new / ?drawer=edit&grenade=N)
// via plain history.pushState, not an Inertia visit — opening it needs no
// new server data (the utility being edited is already in `grenades`).
// This is a different mechanism from `useTeamNav()`'s route().current()
// matching for the top-level sidebar items — don't try to unify them.
function readDrawerFromLocation(grenades: GrenadeEntry[]): DrawerState {
    const params = new URLSearchParams(window.location.search);
    const drawer = params.get('drawer');

    if (drawer === 'new') return { mode: 'create' };

    if (drawer === 'edit') {
        const grenade = grenades.find((g) => g.id === Number(params.get('grenade')));
        if (grenade) return { mode: 'edit', grenade };
    }

    return null;
}

export default function GrenadesIndex({ maps, customMaps, selectedMap, grenades }: IndexProps) {
    const { auth } = usePage<SharedData>().props;
    const navItems = useTeamNav();
    const [drawer, setDrawer] = useState<DrawerState>(() => readDrawerFromLocation(grenades));
    const [addingMap, setAddingMap] = useState(false);
    const [newMapName, setNewMapName] = useState('');
    const [sideFilter, setSideFilter] = useState<SideFilter>('all');
    const [deleteTarget, setDeleteTarget] = useState<GrenadeEntry | null>(null);

    useEffect(() => {
        function onPopState() {
            setDrawer(readDrawerFromLocation(grenades));
        }
        window.addEventListener('popstate', onPopState);
        return () => window.removeEventListener('popstate', onPopState);
    }, [grenades]);

    function pushDrawerUrl(extra: Record<string, string>) {
        const params = new URLSearchParams({ map: selectedMap?.slug ?? '', ...extra });
        window.history.pushState({}, '', `${route('team.grenades.index')}?${params.toString()}`);
    }

    function switchMap(e: MouseEvent, slug: string) {
        e.preventDefault();
        setDrawer(null);
        setAddingMap(false);
        router.visit(`${route('team.grenades.index')}?${new URLSearchParams({ map: slug })}`, {
            only: ['selectedMap', 'grenades'],
            preserveState: true,
            preserveScroll: true,
        });
    }

    function openCreateDrawer(prefillMap?: string) {
        pushDrawerUrl({ drawer: 'new' });
        setDrawer({ mode: 'create', prefillMap });
    }

    function openEditDrawer(grenade: GrenadeEntry) {
        pushDrawerUrl({ drawer: 'edit', grenade: String(grenade.id) });
        setDrawer({ mode: 'edit', grenade });
    }

    function closeDrawer() {
        pushDrawerUrl({});
        setDrawer(null);
    }

    function confirmDelete() {
        if (!deleteTarget) return;
        router.delete(route('team.grenades.destroy', deleteTarget.id));
        setDeleteTarget(null);
    }

    function confirmAddMap() {
        const name = newMapName.trim();
        if (!name) return;
        setAddingMap(false);
        setNewMapName('');
        openCreateDrawer(name);
    }

    const mapSwitcher = (
        <div className="flex flex-col gap-1 border-t border-border pt-4">
            {maps.map((map) => (
                <SidebarNavItem
                    key={map.slug}
                    href={`${route('team.grenades.index')}?${new URLSearchParams({ map: map.slug })}`}
                    active={selectedMap?.slug === map.slug}
                    backgroundImage={map.overview}
                    trailing={<span className={map.overview ? undefined : 'text-xs text-muted-foreground'}>{map.count}</span>}
                    onClick={(e) => switchMap(e, map.slug)}
                >
                    {map.name}
                </SidebarNavItem>
            ))}
            {customMaps.map((map) => (
                <SidebarNavItem
                    key={map.slug}
                    href={`${route('team.grenades.index')}?${new URLSearchParams({ map: map.slug })}`}
                    active={selectedMap?.slug === map.slug}
                    backgroundImage={map.overview}
                    unidentified={!map.overview}
                    trailing={<span className={map.overview ? undefined : 'text-xs text-muted-foreground'}>{map.count}</span>}
                    onClick={(e) => switchMap(e, map.slug)}
                >
                    {map.name}
                </SidebarNavItem>
            ))}
            {addingMap ? (
                <Input
                    autoFocus
                    placeholder="Map name"
                    value={newMapName}
                    onChange={(e) => setNewMapName(e.target.value)}
                    onBlur={() => !newMapName && setAddingMap(false)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') confirmAddMap();
                        if (e.key === 'Escape') setAddingMap(false);
                    }}
                    className="mt-1 h-8 text-sm"
                />
            ) : (
                <button
                    type="button"
                    onClick={() => setAddingMap(true)}
                    className="cursor-pointer rounded-md px-3 py-2 text-left text-sm text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
                >
                    + Add map
                </button>
            )}
        </div>
    );

    const sideFilteredGrenades = sideFilter === 'all' ? grenades : grenades.filter((g) => g.side === sideFilter);
    const grouped = TYPES.map((t) => ({ ...t, items: sideFilteredGrenades.filter((g) => g.type === t.value) })).filter((t) => t.items.length > 0);

    return (
        <TeamLayout
            navItems={navItems}
            onLogout={auth?.user ? () => router.post(route('logout')) : undefined}
            linkAs={Link}
            sidebarExtra={mapSwitcher}
        >
            <Head title="Utility">
                {/* CSS background-images are discovered late (only once the browser gets to paint), which is what causes them to visibly pop in one at a time — preloading fetches all of them in parallel up front instead. */}
                {maps
                    .filter((map) => map.overview)
                    .map((map) => (
                        <link key={map.slug} rel="preload" as="image" href={map.overview!} />
                    ))}
            </Head>

            {selectedMap && (
                <>
                    <div
                        className="relative flex items-end justify-between gap-4 overflow-hidden rounded-2xl bg-cover bg-center p-5"
                        style={selectedMap.overview ? { backgroundImage: `url(${selectedMap.overview})` } : undefined}
                    >
                        {selectedMap.overview && <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />}
                        <div className="relative">
                            <Text variant="display" className={selectedMap.overview ? 'text-white drop-shadow' : undefined}>
                                {selectedMap.name}
                            </Text>
                            <Text variant="muted" className={selectedMap.overview ? 'mt-2 text-white/80' : 'mt-2'}>
                                {grenades.length} {grenades.length === 1 ? 'utility' : 'utilities'}
                            </Text>
                        </div>
                        <Button variant="secondary" className="relative" onClick={() => openCreateDrawer()}>
                            Add utility
                        </Button>
                    </div>

                    <SegmentedControl value={sideFilter} onChange={setSideFilter} options={SIDE_FILTERS} />

                    <div className="flex flex-col gap-3">
                        {sideFilteredGrenades.length === 0 && (
                            <EmptySlotCard
                                label={grenades.length === 0 ? 'No utility yet for this map' : `No ${sideFilter} utility yet for this map`}
                            />
                        )}
                        {grouped.map(({ value, label, Icon, items }) => (
                            <Disclosure
                                key={value}
                                title={
                                    <span className="flex items-center gap-2">
                                        <Icon className="size-5" />
                                        {label}
                                        <span className="text-muted-foreground">({items.length})</span>
                                    </span>
                                }
                            >
                                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                                    {items.map((grenade) => (
                                        <Card key={grenade.id} className="flex flex-col gap-2 p-3">
                                            <div className="flex items-start justify-between gap-2">
                                                <Text variant="body" className="truncate text-sm font-medium">
                                                    {grenade.name}
                                                </Text>
                                                <Badge tone={grenade.side === 'CT' ? 'info' : 'muted'}>{grenade.side}</Badge>
                                            </div>
                                            <VideoThumbnail videoUrl={grenade.video_link} posterUrl={grenade.screenshots[0]?.url} />
                                            <div className="flex items-center justify-between gap-2">
                                                <div className="flex items-center gap-1.5 text-muted-foreground">
                                                    {[
                                                        THROW_BUTTON_META[grenade.throw_button],
                                                        STANCE_META[grenade.stance],
                                                        MOVEMENT_META[grenade.movement],
                                                        JUMP_META[grenade.jump],
                                                    ]
                                                        .filter(Boolean)
                                                        .map(({ Icon, label }, i) => (
                                                            <span key={i} title={label}>
                                                                <Icon className="size-5" />
                                                            </span>
                                                        ))}
                                                </div>
                                                <div className="flex shrink-0 gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="size-6"
                                                        onClick={() => openEditDrawer(grenade)}
                                                        aria-label="Edit"
                                                    >
                                                        <Pencil className="size-3.5" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="size-6"
                                                        onClick={() => setDeleteTarget(grenade)}
                                                        aria-label="Delete"
                                                    >
                                                        <Trash2 className="size-3.5" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            </Disclosure>
                        ))}
                    </div>
                </>
            )}

            <Drawer open={drawer !== null} onClose={closeDrawer} title={drawer?.mode === 'edit' ? 'Edit utility' : 'Add utility'}>
                {drawer && (
                    <GrenadeForm
                        maps={maps}
                        grenade={drawer.mode === 'edit' ? drawer.grenade : undefined}
                        prefillMap={drawer.mode === 'create' ? (drawer.prefillMap ?? selectedMap?.slug) : undefined}
                        onSuccess={() => setDrawer(null)}
                        onCancel={closeDrawer}
                    />
                )}
            </Drawer>

            <ConfirmDialog
                open={deleteTarget !== null}
                onCancel={() => setDeleteTarget(null)}
                onConfirm={confirmDelete}
                title={`Delete "${deleteTarget?.name}"?`}
                description="This can't be undone."
                confirmLabel="Delete"
                destructive
            />
        </TeamLayout>
    );
}
