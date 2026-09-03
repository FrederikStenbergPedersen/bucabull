import {
    Button,
    FieldError,
    Input,
    Label,
    type MentionResolver,
    MentionTextarea,
    MultiSegmentedControl,
    SegmentedControl,
    Select,
    Text,
    TypeFlashIcon,
    TypeGrenadeIcon,
    TypeMolotovIcon,
    TypeSmokeIcon,
} from '@bucabull/ui';
import { useForm } from '@inertiajs/react';
import { Coins, Crosshair, LoaderCircle, Zap } from 'lucide-react';
import { FormEventHandler } from 'react';

import { SIDE_DOT } from '@/lib/side';

interface MapOption {
    slug: string;
    name: string;
    overview: string | null;
}

interface RosterEntry {
    id: number;
    nickname: string;
    avatar: string | null;
}

interface UtilityEntry {
    id: number;
    name: string;
    type: string;
    side: string;
}

interface StrategyRecord {
    id: number;
    map: string;
    name: string;
    types: string[];
    side: string;
    note: string | null;
    video_link: string | null;
    description: string | null;
}

export interface StrategyFormProps {
    maps: MapOption[];
    roster: RosterEntry[];
    utility: UtilityEntry[];
    strategy?: StrategyRecord;
    prefillMap?: string | null;
    onSuccess: () => void;
    onCancel: () => void;
}

const TYPE_OPTIONS = [
    { value: 'buyround', label: 'Buy round', icon: <Coins className="size-4" /> },
    { value: 'force', label: 'Force', icon: <Zap className="size-4" /> },
    { value: 'pistol', label: 'Pistol', icon: <Crosshair className="size-4" /> },
];

// A generic, un-linked utility type mention — "just a smoke", not
// necessarily one of the team's saved Utility entries (see the "Utility"
// section below, which lists those). Matches GrenadeController::TYPES.
const UTILITY_TYPE_MENTIONS = [
    { id: 'smoke', label: 'Smoke', icon: <TypeSmokeIcon className="size-4" /> },
    { id: 'flash', label: 'Flash', icon: <TypeFlashIcon className="size-4" /> },
    { id: 'grenade', label: 'Grenade', icon: <TypeGrenadeIcon className="size-4" /> },
    { id: 'molotov', label: 'Molotov', icon: <TypeMolotovIcon className="size-4" /> },
];

export function StrategyForm({ maps, roster, utility, strategy, prefillMap, onSuccess, onCancel }: StrategyFormProps) {
    const curatedSlugs = maps.map((m) => m.slug);
    const rawInitialMap = strategy?.map ?? prefillMap ?? maps[0]?.slug ?? 'other';
    const initialIsCurated = curatedSlugs.includes(rawInitialMap);

    // Same resolution the read-view card uses (see pages/team/strategies/index.tsx)
    // so an existing description's mentions render as clean chips here too,
    // not the raw @[Label](kind:id) storage syntax.
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
                return item ? { label: item.name } : undefined;
            },
        },
    ];

    const form = useForm({
        map: initialIsCurated ? rawInitialMap : 'other',
        custom_map_name: initialIsCurated ? '' : rawInitialMap,
        name: strategy?.name ?? '',
        types: strategy?.types ?? ([] as string[]),
        side: strategy?.side ?? 'T',
        note: strategy?.note ?? '',
        video_link: strategy?.video_link ?? '',
        description: strategy?.description ?? '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        const options = { onSuccess } as const;

        if (strategy) {
            form.put(route('team.strategies.update', strategy.id), options);
        } else {
            form.post(route('team.strategies.store'), options);
        }
    };

    return (
        <form className="flex flex-col gap-4" onSubmit={submit}>
            <div className="grid gap-2">
                <Label htmlFor="map">Map</Label>
                <Select id="map" value={form.data.map} onChange={(e) => form.setData('map', e.target.value)}>
                    {maps.map((m) => (
                        <option key={m.slug} value={m.slug}>
                            {m.name}
                        </option>
                    ))}
                    <option value="other">Other</option>
                </Select>
                <FieldError message={form.errors.map} />
                {form.data.map === 'other' && (
                    <>
                        <Input
                            placeholder="Map name"
                            value={form.data.custom_map_name}
                            onChange={(e) => form.setData('custom_map_name', e.target.value)}
                        />
                        <FieldError message={form.errors.custom_map_name} />
                    </>
                )}
            </div>

            <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" value={form.data.name} onChange={(e) => form.setData('name', e.target.value)} />
                <FieldError message={form.errors.name} />
            </div>

            <div className="grid gap-2">
                <Label>Type</Label>
                <MultiSegmentedControl value={form.data.types} onChange={(v) => form.setData('types', v)} options={TYPE_OPTIONS} />
                <FieldError message={form.errors.types} />
            </div>

            <div className="grid gap-2">
                <Label>Side</Label>
                <SegmentedControl
                    value={form.data.side}
                    onChange={(v) => form.setData('side', v)}
                    options={[
                        { value: 'CT', label: 'CT', icon: <span className={`size-4 rounded-full ${SIDE_DOT.CT}`} /> },
                        { value: 'T', label: 'T', icon: <span className={`size-4 rounded-full ${SIDE_DOT.T}`} /> },
                    ]}
                />
            </div>

            <div className="grid grid-cols-2 items-start gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="note">Note</Label>
                    <Input id="note" value={form.data.note} onChange={(e) => form.setData('note', e.target.value)} />
                    <FieldError message={form.errors.note} />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="video_link">Video link</Label>
                    <Input
                        id="video_link"
                        type="url"
                        placeholder="https://..."
                        value={form.data.video_link}
                        onChange={(e) => form.setData('video_link', e.target.value)}
                    />
                    <FieldError message={form.errors.video_link} />
                </div>
            </div>

            <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Text variant="muted" className="text-xs">
                    Type <span className="font-mono">@</span> to mention a player, <span className="font-mono">#</span> for a utility type or a saved
                    Utility entry.
                </Text>
                <MentionTextarea
                    id="description"
                    rows={5}
                    value={form.data.description}
                    onChange={(v) => form.setData('description', v)}
                    resolvers={resolvers}
                    triggers={[
                        {
                            char: '@',
                            sections: [
                                {
                                    heading: 'Roster',
                                    items: roster.map((r) => ({ id: r.id, kind: 'player', label: r.nickname })),
                                },
                            ],
                        },
                        {
                            char: '#',
                            sections: [
                                {
                                    heading: 'Type',
                                    items: UTILITY_TYPE_MENTIONS.map((t) => ({ id: t.id, kind: 'type', label: t.label, icon: t.icon })),
                                },
                                {
                                    heading: 'Utility',
                                    items: utility.map((u) => ({
                                        id: u.id,
                                        kind: 'utility',
                                        label: u.name,
                                        sublabel: `${u.type} · ${u.side}`,
                                    })),
                                },
                            ],
                        },
                    ]}
                />
                <FieldError message={form.errors.description} />
            </div>

            <div className="flex items-center gap-3">
                <Button type="submit" disabled={form.processing}>
                    {form.processing && <LoaderCircle className="h-4 w-4 animate-spin" />}
                    {strategy ? 'Save changes' : 'Add strategy'}
                </Button>
                <Button type="button" variant="secondary" onClick={onCancel}>
                    Cancel
                </Button>
            </div>
        </form>
    );
}
