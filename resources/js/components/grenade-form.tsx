import {
    Button,
    FieldError,
    Input,
    JumpJumpingIcon,
    JumpStandingIcon,
    Label,
    MovementRunningIcon,
    MovementStandingIcon,
    MovementWalkingIcon,
    RemovableThumbnail,
    ScreenshotUpload,
    SegmentedControl,
    Select,
    StanceCrouchingIcon,
    StanceStandingIcon,
    Text,
    Textarea,
    ThrowBothClickIcon,
    ThrowLeftClickIcon,
    ThrowRightClickIcon,
    TypeFlashIcon,
    TypeGrenadeIcon,
    TypeMolotovIcon,
    TypeSmokeIcon,
} from '@bucabull/ui';
import { router, useForm } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import { FormEventHandler, useState } from 'react';

interface MapOption {
    slug: string;
    name: string;
    overview: string | null;
}

interface ExistingScreenshot {
    id: number;
    url: string;
}

interface GrenadeRecord {
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
    screenshots: ExistingScreenshot[];
}

export interface GrenadeFormProps {
    maps: MapOption[];
    grenade?: GrenadeRecord;
    prefillMap?: string | null;
    onSuccess: () => void;
    onCancel: () => void;
}

// Same CT=info(cyan)/T=muted color mapping already shown on each lineup
// card's Side badge — kept in one place (exported for the index page's
// side filter too) so they never drift apart.
export const SIDE_DOT: Record<string, string> = {
    CT: 'bg-accent-secondary',
    T: 'bg-muted-foreground',
};

export function GrenadeForm({ maps, grenade, prefillMap, onSuccess, onCancel }: GrenadeFormProps) {
    const curatedSlugs = maps.map((m) => m.slug);
    const rawInitialMap = grenade?.map ?? prefillMap ?? maps[0]?.slug ?? 'other';
    const initialIsCurated = curatedSlugs.includes(rawInitialMap);
    const existingScreenshots = grenade?.screenshots ?? [];
    const [deletingId, setDeletingId] = useState<number | null>(null);

    const form = useForm({
        map: initialIsCurated ? rawInitialMap : 'other',
        custom_map_name: initialIsCurated ? '' : rawInitialMap,
        name: grenade?.name ?? '',
        setpos: grenade?.setpos ?? '',
        description: grenade?.description ?? '',
        video_link: grenade?.video_link ?? '',
        side: grenade?.side ?? 'T',
        throw_button: grenade?.throw_button ?? 'left',
        stance: grenade?.stance ?? 'standing',
        movement: grenade?.movement ?? 'standing',
        jump: grenade?.jump ?? 'standing',
        type: grenade?.type ?? 'smoke',
        screenshots: [] as File[],
    });

    const screenshotErrors = Object.entries(form.errors)
        .filter(([key]) => key.startsWith('screenshots'))
        .map(([, message]) => message as string);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        const options = { forceFormData: true, onSuccess } as const;

        if (grenade) {
            form.transform((data) => ({ ...data, _method: 'put' }));
            form.post(route('team.grenades.update', grenade.id), options);
        } else {
            form.post(route('team.grenades.store'), options);
        }
    };

    function removeExisting(screenshotId: number) {
        if (!grenade) return;

        setDeletingId(screenshotId);
        router.delete(route('team.grenades.screenshots.destroy', { grenade: grenade.id, screenshot: screenshotId }), {
            preserveScroll: true,
            onFinish: () => setDeletingId(null),
        });
    }

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

            <div className="grid grid-cols-2 items-start gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="name">Name</Label>
                    <Input id="name" value={form.data.name} onChange={(e) => form.setData('name', e.target.value)} />
                    <FieldError message={form.errors.name} />
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
                <Label htmlFor="setpos">Setpos command</Label>
                <Input
                    id="setpos"
                    className="font-mono"
                    value={form.data.setpos}
                    onChange={(e) => form.setData('setpos', e.target.value)}
                />
                <FieldError message={form.errors.setpos} />
            </div>

            <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                    id="description"
                    rows={2}
                    value={form.data.description}
                    onChange={(e) => form.setData('description', e.target.value)}
                />
                <FieldError message={form.errors.description} />
            </div>

            <div className="grid gap-2">
                <Label>Type</Label>
                <SegmentedControl
                    value={form.data.type}
                    onChange={(v) => form.setData('type', v)}
                    options={[
                        { value: 'smoke', label: 'Smoke', icon: <TypeSmokeIcon className="size-7" /> },
                        { value: 'flash', label: 'Flash', icon: <TypeFlashIcon className="size-7" /> },
                        { value: 'grenade', label: 'Grenade', icon: <TypeGrenadeIcon className="size-7" /> },
                        { value: 'molotov', label: 'Molotov', icon: <TypeMolotovIcon className="size-7" /> },
                    ]}
                />
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
                    <Label>Throw button</Label>
                    <SegmentedControl
                        value={form.data.throw_button}
                        onChange={(v) => form.setData('throw_button', v)}
                        options={[
                            { value: 'left', label: 'Left click', icon: <ThrowLeftClickIcon className="size-5" /> },
                            { value: 'right', label: 'Right click', icon: <ThrowRightClickIcon className="size-5" /> },
                            { value: 'both', label: 'Both', icon: <ThrowBothClickIcon className="size-5" /> },
                        ]}
                    />
                </div>
                <div className="grid gap-2">
                    <Label>Stance</Label>
                    <SegmentedControl
                        value={form.data.stance}
                        onChange={(v) => form.setData('stance', v)}
                        options={[
                            { value: 'standing', label: 'Standing', icon: <StanceStandingIcon className="size-5" /> },
                            { value: 'crouching', label: 'Crouching', icon: <StanceCrouchingIcon className="size-5" /> },
                        ]}
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 items-start gap-4">
                <div className="grid gap-2">
                    <Label>Movement</Label>
                    <SegmentedControl
                        value={form.data.movement}
                        onChange={(v) => form.setData('movement', v)}
                        options={[
                            { value: 'standing', label: 'Standing', icon: <MovementStandingIcon className="size-5" /> },
                            { value: 'walking', label: 'Walking', icon: <MovementWalkingIcon className="size-5" /> },
                            { value: 'running', label: 'Running', icon: <MovementRunningIcon className="size-5" /> },
                        ]}
                    />
                </div>
                <div className="grid gap-2">
                    <Label>Jump</Label>
                    <SegmentedControl
                        value={form.data.jump}
                        onChange={(v) => form.setData('jump', v)}
                        options={[
                            { value: 'standing', label: 'Standing', icon: <JumpStandingIcon className="size-5" /> },
                            { value: 'jumping', label: 'Jumping', icon: <JumpJumpingIcon className="size-5" /> },
                        ]}
                    />
                </div>
            </div>

            <div className="grid gap-2">
                <Label>Screenshots</Label>
                {existingScreenshots.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        {existingScreenshots.map((screenshot) => (
                            <RemovableThumbnail
                                key={screenshot.id}
                                src={screenshot.url}
                                onRemove={() => removeExisting(screenshot.id)}
                                disabled={deletingId === screenshot.id}
                            />
                        ))}
                    </div>
                )}
                <ScreenshotUpload
                    files={form.data.screenshots}
                    onChange={(files) => form.setData('screenshots', files)}
                    max={Math.max(0, 3 - existingScreenshots.length)}
                    errors={screenshotErrors}
                />
                {form.progress && <Text variant="muted">Uploading… {form.progress.percentage}%</Text>}
            </div>

            <div className="flex items-center gap-3">
                <Button type="submit" disabled={form.processing}>
                    {form.processing && <LoaderCircle className="h-4 w-4 animate-spin" />}
                    {grenade ? 'Save changes' : 'Add utility'}
                </Button>
                <Button type="button" variant="secondary" onClick={onCancel}>
                    Cancel
                </Button>
            </div>
        </form>
    );
}
