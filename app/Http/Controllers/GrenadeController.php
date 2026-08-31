<?php

namespace App\Http\Controllers;

use App\Models\Grenade;
use App\Models\GrenadeScreenshot;
use App\Support\MapOverview;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class GrenadeController extends Controller
{
    private const SIDES = ['CT', 'T'];

    private const THROW_BUTTONS = ['left', 'right', 'both'];

    private const STANCES = ['standing', 'crouching'];

    private const MOVEMENTS = ['standing', 'walking', 'running'];

    private const JUMPS = ['standing', 'jumping'];

    private const TYPES = ['smoke', 'flash', 'grenade', 'molotov'];

    /**
     * The whole tool is one page: curated maps (with live counts), custom
     * maps with at least one entry, and the currently-selected map's
     * lineups. Map selection is a query string (?map=) rather than a path
     * segment or a separate route — free-text "Other" map names can
     * contain characters that don't survive a route parameter, and
     * keeping this on one route is what lets the frontend switch maps via
     * an Inertia partial reload instead of a full page navigation.
     */
    public function index(Request $request): Response
    {
        $teamId = $request->user()->team_id;

        $counts = Grenade::where('team_id', $teamId)
            ->selectRaw('map, count(*) as count')
            ->groupBy('map')
            ->pluck('count', 'map');

        $curatedSlugs = array_column(config('maps'), 'slug');

        $maps = collect(config('maps'))->map(fn (array $map) => [
            ...$map,
            'count' => $counts->get($map['slug'], 0),
        ])->values();

        $customMaps = $counts->reject(fn ($count, $map) => in_array($map, $curatedSlugs, true))
            ->map(fn ($count, $map) => ['slug' => $map, 'name' => $map, 'overview' => MapOverview::guess($map), 'count' => $count])
            ->values();

        $selectedMapKey = $request->query('map') ?: ($maps->first()['slug'] ?? null);

        $selectedMap = collect(config('maps'))->firstWhere('slug', $selectedMapKey)
            ?? ($selectedMapKey ? ['slug' => $selectedMapKey, 'name' => $selectedMapKey, 'overview' => MapOverview::guess($selectedMapKey)] : null);

        $grenades = $selectedMapKey
            ? Grenade::where('team_id', $teamId)->where('map', $selectedMapKey)->with('screenshots')->latest()->get()
            : collect();

        return Inertia::render('team/grenades/index', [
            'maps' => $maps,
            'customMaps' => $customMaps,
            'selectedMap' => $selectedMap,
            'grenades' => $grenades,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $this->validateGrenade($request, existingScreenshotCount: 0);

        $grenade = Grenade::create([
            ...$this->attributesFromRequest($data),
            'team_id' => $request->user()->team_id,
            'user_id' => $request->user()->id,
        ]);

        $this->storeScreenshots($grenade, $request);

        return to_route('team.grenades.index', ['map' => $grenade->map]);
    }

    public function update(Request $request, Grenade $grenade): RedirectResponse
    {
        abort_unless($grenade->team_id === $request->user()->team_id, 403);

        $data = $this->validateGrenade($request, existingScreenshotCount: $grenade->screenshots()->count());

        $grenade->update($this->attributesFromRequest($data));

        $this->storeScreenshots($grenade, $request);

        return to_route('team.grenades.index', ['map' => $grenade->map]);
    }

    public function destroy(Request $request, Grenade $grenade): RedirectResponse
    {
        abort_unless($grenade->team_id === $request->user()->team_id, 403);

        foreach ($grenade->screenshots as $screenshot) {
            Storage::disk('public')->delete($screenshot->path);
        }

        $map = $grenade->map;
        $grenade->delete();

        return to_route('team.grenades.index', ['map' => $map]);
    }

    public function destroyScreenshot(Request $request, Grenade $grenade, GrenadeScreenshot $screenshot): RedirectResponse
    {
        abort_unless($grenade->team_id === $request->user()->team_id, 403);
        abort_unless($screenshot->grenade_id === $grenade->id, 404);

        Storage::disk('public')->delete($screenshot->path);
        $screenshot->delete();

        return back();
    }

    private function validateGrenade(Request $request, int $existingScreenshotCount): array
    {
        $curatedSlugs = array_column(config('maps'), 'slug');

        return Validator::make($request->all(), [
            'map' => ['required', 'string', Rule::in([...$curatedSlugs, 'other'])],
            'custom_map_name' => ['required_if:map,other', 'nullable', 'string', 'max:60'],
            'name' => ['required', 'string', 'max:100'],
            'setpos' => ['nullable', 'string'],
            'description' => ['nullable', 'string', 'max:2000'],
            'video_link' => ['nullable', 'url', 'max:255'],
            'side' => ['required', Rule::in(self::SIDES)],
            'throw_button' => ['required', Rule::in(self::THROW_BUTTONS)],
            'stance' => ['required', Rule::in(self::STANCES)],
            'movement' => ['required', Rule::in(self::MOVEMENTS)],
            'jump' => ['required', Rule::in(self::JUMPS)],
            'type' => ['required', Rule::in(self::TYPES)],
            'screenshots' => [
                'nullable',
                'array',
                function (string $attribute, mixed $value, \Closure $fail) use ($existingScreenshotCount) {
                    if ($existingScreenshotCount + count($value) > 3) {
                        $fail('A grenade can have at most 3 screenshots.');
                    }
                },
            ],
            'screenshots.*' => ['image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
        ])->validate();
    }

    private function attributesFromRequest(array $data): array
    {
        return [
            'map' => $data['map'] === 'other' ? trim($data['custom_map_name']) : $data['map'],
            'name' => $data['name'],
            'setpos' => $data['setpos'] ?? null,
            'description' => $data['description'] ?? null,
            'video_link' => $data['video_link'] ?? null,
            'side' => $data['side'],
            'throw_button' => $data['throw_button'],
            'stance' => $data['stance'],
            'movement' => $data['movement'],
            'jump' => $data['jump'],
            'type' => $data['type'],
        ];
    }

    private function storeScreenshots(Grenade $grenade, Request $request): void
    {
        if (! $request->hasFile('screenshots')) {
            return;
        }

        $position = $grenade->screenshots()->max('position') + 1;

        foreach ($request->file('screenshots') as $file) {
            $path = $file->store('grenade-screenshots', 'public');

            $grenade->screenshots()->create([
                'path' => $path,
                'position' => $position++,
            ]);
        }
    }
}
