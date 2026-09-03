import {
    Badge,
    Button,
    Card,
    ConfirmDialog,
    Drawer,
    EmptySlotCard,
    Input,
    type MentionResolver,
    MentionText,
    SegmentedControl,
    type SegmentedControlOption,
    SidebarNavItem,
    TeamLayout,
    Text,
    VideoThumbnail,
} from '@bucabull/ui';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { Coins, Crosshair, Pencil, Trash2, Zap } from 'lucide-react';
import { MouseEvent, useEffect, useState } from 'react';

import { StrategyForm } from '@/components/strategy-form';
import { useTeamNav } from '@/hooks/use-team-nav';
import { SIDE_DOT } from '@/lib/side';
import { type SharedData } from '@/types';

interface MapEntry {
    slug: string;
    name: string;
    overview: string | null;
    count: number;
}

interface SelectedMap {
    slug: string;
    name: string;
    overview: string | null;
}

interface RosterEntry {
    id: number;
    nickname: string;
    avatar: string | null;
}

interface UtilityScreenshot {
    id: number;
    url: string;
}

interface UtilityEntry {
    id: number;
    name: string;
    type: string;
    side: string;
    video_link: string | null;
    screenshots: UtilityScreenshot[];
}

interface StrategyEntry {
    id: number;
    map: string;
    name: string;
    types: string[];
    side: string;
    note: string | null;
    video_link: string | null;
    description: string | null;
}

interface IndexProps {
    maps: MapEntry[];
    customMaps: MapEntry[];
    selectedMap: SelectedMap | null;
    strategies: StrategyEntry[];
    roster: RosterEntry[];
    utility: UtilityEntry[];
}

type DrawerState = { mode: 'create'; prefillMap?: string } | { mode: 'edit'; strategy: StrategyEntry } | null;

const TYPE_META: Record<string, { label: string; Icon: typeof Coins }> = {
    buyround: { label: 'Buy round', Icon: Coins },
    force: { label: 'Force', Icon: Zap },
    pistol: { label: 'Pistol', Icon: Crosshair },
};

type SideFilter = 'all' | 'CT' | 'T';

const SIDE_FILTERS: SegmentedControlOption<SideFilter>[] = [
    { value: 'all', label: 'All' },
    { value: 'CT', label: 'CT', icon: <span className={`size-4 rounded-full ${SIDE_DOT.CT}`} /> },
    { value: 'T', label: 'T', icon: <span className={`size-4 rounded-full ${SIDE_DOT.T}`} /> },
];

// Same URL-driven drawer mechanism as Grenades' index — see the comment
// there (readDrawerFromLocation) for why this is plain history.pushState
// rather than an Inertia visit.
function readDrawerFromLocation(strategies: StrategyEntry[]): DrawerState {
    const params = new URLSearchParams(window.location.search);
    const drawer = params.get('drawer');

    if (drawer === 'new') return { mode: 'create' };

    if (drawer === 'edit') {
        const strategy = strategies.find((s) => s.id === Number(params.get('strategy')));
        if (strategy) return { mode: 'edit', strategy };
    }

    return null;
}

export default function StrategiesIndex({ maps, customMaps, selectedMap, strategies, roster, utility }: IndexProps) {
    const { auth } = usePage<SharedData>().props;
    const navItems = useTeamNav();
    const [drawer, setDrawer] = useState<DrawerState>(() => readDrawerFromLocation(strategies));
    const [addingMap, setAddingMap] = useState(false);
    const [newMapName, setNewMapName] = useState('');
    const [sideFilter, setSideFilter] = useState<SideFilter>('all');
    const [deleteTarget, setDeleteTarget] = useState<StrategyEntry | null>(null);

    useEffect(() => {
        function onPopState() {
            setDrawer(readDrawerFromLocation(strategies));
        }
        window.addEventListener('popstate', onPopState);
        return () => window.removeEventListener('popstate', onPopState);
    }, [strategies]);

    function pushDrawerUrl(extra: Record<string, string>) {
        const params = new URLSearchParams({ map: selectedMap?.slug ?? '', ...extra });
        window.history.pushState({}, '', `${route('team.strategies.index')}?${params.toString()}`);
    }

    function switchMap(e: MouseEvent, slug: string) {
        e.preventDefault();
        setDrawer(null);
        setAddingMap(false);
        router.visit(`${route('team.strategies.index')}?${new URLSearchParams({ map: slug })}`, {
            only: ['selectedMap', 'strategies', 'utility'],
            preserveState: true,
            preserveScroll: true,
        });
    }

    function openCreateDrawer(prefillMap?: string) {
        pushDrawerUrl({ drawer: 'new' });
        setDrawer({ mode: 'create', prefillMap });
    }

    function openEditDrawer(strategy: StrategyEntry) {
        pushDrawerUrl({ drawer: 'edit', strategy: String(strategy.id) });
        setDrawer({ mode: 'edit', strategy });
    }

    function closeDrawer() {
        pushDrawerUrl({});
        setDrawer(null);
    }

    function confirmDelete() {
        if (!deleteTarget) return;
        router.delete(route('team.strategies.destroy', deleteTarget.id));
        setDeleteTarget(null);
    }

    function confirmAddMap() {
        const name = newMapName.trim();
        if (!name) return;
        setAddingMap(false);
        setNewMapName('');
        openCreateDrawer(name);
    }

    const resolvers: MentionResolver[] = [
        {
            kind: 'player',
            lookup: (id) => {
                const player = roster.find((r) => r.id === Number(id));
                return player ? { label: player.nickname } : undefined;
            },
        },
        {
            kind: 'utility',
            lookup: (id) => {
                const item = utility.find((u) => u.id === Number(id));
                if (!item) return undefined;

                return {
                    label: item.name,
                    href: `${route('team.grenades.index')}?${new URLSearchParams({ map: selectedMap?.slug ?? '' })}`,
                    videoUrl: item.video_link,
                    posterUrl: item.screenshots[0]?.url,
                };
            },
        },
    ];

    const mapSwitcher = (
        <div className="border-border flex flex-col gap-1 border-t pt-4">
            {maps.map((map) => (
                <SidebarNavItem
                    key={map.slug}
                    href={`${route('team.strategies.index')}?${new URLSearchParams({ map: map.slug })}`}
                    active={selectedMap?.slug === map.slug}
                    backgroundImage={map.overview}
                    trailing={<span className={map.overview ? undefined : 'text-muted-foreground text-xs'}>{map.count}</span>}
                    onClick={(e) => switchMap(e, map.slug)}
                >
                    {map.name}
                </SidebarNavItem>
            ))}
            {customMaps.map((map) => (
                <SidebarNavItem
                    key={map.slug}
                    href={`${route('team.strategies.index')}?${new URLSearchParams({ map: map.slug })}`}
                    active={selectedMap?.slug === map.slug}
                    backgroundImage={map.overview}
                    unidentified={!map.overview}
                    trailing={<span className={map.overview ? undefined : 'text-muted-foreground text-xs'}>{map.count}</span>}
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
                    className="text-muted-foreground hover:bg-muted/60 hover:text-foreground cursor-pointer rounded-md px-3 py-2 text-left text-sm transition-colors"
                >
                    + Add map
                </button>
            )}
        </div>
    );

    const sideFilteredStrategies = sideFilter === 'all' ? strategies : strategies.filter((s) => s.side === sideFilter);

    return (
        <TeamLayout
            navItems={navItems}
            onLogout={auth?.user ? () => router.post(route('logout')) : undefined}
            linkAs={Link}
            sidebarExtra={mapSwitcher}
        >
            <Head title="Strategies">
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
                                {strategies.length} {strategies.length === 1 ? 'strategy' : 'strategies'}
                            </Text>
                        </div>
                        <Button variant="secondary" className="relative" onClick={() => openCreateDrawer()}>
                            Add strategy
                        </Button>
                    </div>

                    <SegmentedControl value={sideFilter} onChange={setSideFilter} options={SIDE_FILTERS} />

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {sideFilteredStrategies.length === 0 && (
                            <EmptySlotCard
                                label={strategies.length === 0 ? 'No strategies yet for this map' : `No ${sideFilter} strategies yet for this map`}
                            />
                        )}
                        {sideFilteredStrategies.map((strategy) => (
                            <Card key={strategy.id} className="flex flex-col gap-2 p-3">
                                <div className="flex items-start justify-between gap-2">
                                    <Text variant="body" className="truncate text-sm font-medium">
                                        {strategy.name}
                                    </Text>
                                    <div className="flex shrink-0 gap-1">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="size-6"
                                            onClick={() => openEditDrawer(strategy)}
                                            aria-label="Edit"
                                        >
                                            <Pencil className="size-3.5" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="size-6"
                                            onClick={() => setDeleteTarget(strategy)}
                                            aria-label="Delete"
                                        >
                                            <Trash2 className="size-3.5" />
                                        </Button>
                                    </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-1.5">
                                    <Badge tone={strategy.side === 'CT' ? 'info' : 'warning'}>{strategy.side}</Badge>
                                    {strategy.types.map((type) => {
                                        const meta = TYPE_META[type];
                                        return (
                                            <Badge key={type} tone="neutral">
                                                {meta && <meta.Icon className="size-3" />}
                                                {meta?.label ?? type}
                                            </Badge>
                                        );
                                    })}
                                </div>

                                {strategy.video_link && <VideoThumbnail videoUrl={strategy.video_link} />}

                                {strategy.note && <Text variant="muted">{strategy.note}</Text>}

                                {strategy.description && (
                                    <MentionText value={strategy.description} resolvers={resolvers} linkAs={Link} className="text-sm" />
                                )}
                            </Card>
                        ))}
                    </div>
                </>
            )}

            <Drawer open={drawer !== null} onClose={closeDrawer} title={drawer?.mode === 'edit' ? 'Edit strategy' : 'Add strategy'}>
                {drawer && (
                    <StrategyForm
                        maps={maps}
                        roster={roster}
                        utility={utility}
                        strategy={drawer.mode === 'edit' ? drawer.strategy : undefined}
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
