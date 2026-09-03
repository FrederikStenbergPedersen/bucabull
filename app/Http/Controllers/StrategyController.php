<?php

namespace App\Http\Controllers;

use App\Models\Grenade;
use App\Models\Strategy;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class StrategyController extends Controller
{
    private const SIDES = ['CT', 'T'];

    private const TYPES = ['buyround', 'force', 'pistol'];

    /**
     * Same one-page-per-map shape as GrenadeController::index — curated
     * maps with live counts, custom maps with at least one entry, and the
     * currently-selected map's strategies. Additionally loads the roster
     * and the selected map's utility, which the description field's @/#
     * mention picker needs.
     */
    public function index(Request $request): Response
    {
        $team = $request->user()->team;
        $teamId = $team->id;

        $counts = Strategy::where('team_id', $teamId)
            ->selectRaw('map, count(*) as count')
            ->groupBy('map')
            ->pluck('count', 'map');

        $curatedSlugs = array_column(config('maps'), 'slug');

        $maps = collect(config('maps'))->map(fn (array $map) => [
            ...$map,
            'count' => $counts->get($map['slug'], 0),
        ])->values();

        $customMaps = $counts->reject(fn ($count, $map) => in_array($map, $curatedSlugs, true))
            ->map(fn ($count, $map) => ['slug' => $map, 'name' => $map, 'overview' => $this->guessOverview($map), 'count' => $count])
            ->values();

        $selectedMapKey = $request->query('map') ?: ($maps->first()['slug'] ?? null);

        $selectedMap = collect(config('maps'))->firstWhere('slug', $selectedMapKey)
            ?? ($selectedMapKey ? ['slug' => $selectedMapKey, 'name' => $selectedMapKey, 'overview' => $this->guessOverview($selectedMapKey)] : null);

        $strategies = $selectedMapKey
            ? Strategy::where('team_id', $teamId)->where('map', $selectedMapKey)->latest()->get()
            : collect();

        $roster = $team->users()->get(['id', 'nickname', 'avatar']);

        $utility = $selectedMapKey
            ? Grenade::where('team_id', $teamId)->where('map', $selectedMapKey)->with('screenshots')->get(['id', 'name', 'type', 'side', 'video_link'])
            : collect();

        return Inertia::render('team/strategies/index', [
            'maps' => $maps,
            'customMaps' => $customMaps,
            'selectedMap' => $selectedMap,
            'strategies' => $strategies,
            'roster' => $roster,
            'utility' => $utility,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $this->validateStrategy($request);

        $strategy = Strategy::create([
            ...$this->attributesFromRequest($data),
            'team_id' => $request->user()->team_id,
            'user_id' => $request->user()->id,
        ]);

        return to_route('team.strategies.index', ['map' => $strategy->map]);
    }

    public function update(Request $request, Strategy $strategy): RedirectResponse
    {
        abort_unless($strategy->team_id === $request->user()->team_id, 403);

        $data = $this->validateStrategy($request);

        $strategy->update($this->attributesFromRequest($data));

        return to_route('team.strategies.index', ['map' => $strategy->map]);
    }

    public function destroy(Request $request, Strategy $strategy): RedirectResponse
    {
        abort_unless($strategy->team_id === $request->user()->team_id, 403);

        $map = $strategy->map;
        $strategy->delete();

        return to_route('team.strategies.index', ['map' => $map]);
    }

    /**
     * Same "typed instead of selected" heuristic as
     * GrenadeController::guessOverview.
     */
    private function guessOverview(string $customMapName): ?string
    {
        $normalized = $this->normalizeMapName($customMapName);

        foreach (config('maps') as $map) {
            if ($normalized === $this->normalizeMapName($map['slug']) || $normalized === $this->normalizeMapName($map['name'])) {
                return $map['overview'];
            }
        }

        return null;
    }

    private function normalizeMapName(string $name): string
    {
        $name = preg_replace('/^(de|cs|dz)[_\s]+/i', '', trim($name));

        return preg_replace('/[^a-z0-9]/', '', strtolower($name));
    }

    private function validateStrategy(Request $request): array
    {
        $curatedSlugs = array_column(config('maps'), 'slug');

        return Validator::make($request->all(), [
            'map' => ['required', 'string', Rule::in([...$curatedSlugs, 'other'])],
            'custom_map_name' => ['required_if:map,other', 'nullable', 'string', 'max:60'],
            'name' => ['required', 'string', 'max:100'],
            'types' => ['required', 'array', 'min:1'],
            'types.*' => [Rule::in(self::TYPES)],
            'side' => ['required', Rule::in(self::SIDES)],
            'note' => ['nullable', 'string', 'max:500'],
            'video_link' => ['nullable', 'url', 'max:255'],
            'description' => ['nullable', 'string', 'max:5000'],
        ])->validate();
    }

    private function attributesFromRequest(array $data): array
    {
        return [
            'map' => $data['map'] === 'other' ? trim($data['custom_map_name']) : $data['map'],
            'name' => $data['name'],
            'types' => $data['types'],
            'side' => $data['side'],
            'note' => $data['note'] ?? null,
            'video_link' => $data['video_link'] ?? null,
            'description' => $data['description'] ?? null,
        ];
    }
}
