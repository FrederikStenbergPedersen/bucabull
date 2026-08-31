<?php

namespace App\Jobs;

use App\Models\FaceitMatch;
use App\Models\PlayerStat;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class RefreshRosterStatsJob implements ShouldQueue
{
    use Queueable;

    private const MATCH_HISTORY_LIMIT = 20;

    public function handle(): void
    {
        $users = User::whereNotNull('steam_id')->get();

        if ($users->isEmpty()) {
            return;
        }

        $summaries = $this->fetchSteamSummaries($users->pluck('steam_id')->all());

        foreach ($users as $user) {
            $summary = $summaries[$user->steam_id] ?? null;
            $playtime = $this->fetchRecentPlaytime($user->steam_id);
            $faceit = $this->fetchFaceitStats($user->steam_id);

            PlayerStat::updateOrCreate(
                ['user_id' => $user->id],
                [
                    'steam_persona_state' => $summary['personastate'] ?? null,
                    'steam_last_seen_at' => isset($summary['lastlogoff']) ? Carbon::createFromTimestamp($summary['lastlogoff']) : null,
                    'playtime_2weeks_minutes' => $playtime,
                    'faceit_skill_level' => $faceit['skill_level'] ?? null,
                    'faceit_elo' => $faceit['faceit_elo'] ?? null,
                    'faceit_region' => $faceit['region'] ?? null,
                    'faceit_player_id' => $faceit['player_id'] ?? null,
                    'faceit_lifetime_matches' => $faceit['lifetime_matches'] ?? null,
                    'faceit_lifetime_win_rate' => $faceit['lifetime_win_rate'] ?? null,
                    'faceit_lifetime_avg_kd' => $faceit['lifetime_avg_kd'] ?? null,
                    'fetched_at' => now(),
                ],
            );

            if (! empty($faceit['player_id'])) {
                $this->refreshFaceitMatchHistory($user, $faceit['player_id']);
            }
        }
    }

    /**
     * @param  list<string>  $steamIds
     * @return array<string, array<string, mixed>> keyed by steamid
     */
    private function fetchSteamSummaries(array $steamIds): array
    {
        $key = config('services.steam.client_secret');

        if (! $key) {
            return [];
        }

        $response = Http::get('https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/', [
            'key' => $key,
            'steamids' => implode(',', $steamIds),
        ]);

        if ($response->failed()) {
            Log::warning('Steam GetPlayerSummaries failed', ['status' => $response->status()]);

            return [];
        }

        $players = $response->json('response.players', []);

        return collect($players)->keyBy('steamid')->all();
    }

    private function fetchRecentPlaytime(string $steamId): ?int
    {
        $key = config('services.steam.client_secret');

        if (! $key) {
            return null;
        }

        $response = Http::get('https://api.steampowered.com/IPlayerService/GetRecentlyPlayedGames/v1/', [
            'key' => $key,
            'steamid' => $steamId,
        ]);

        if ($response->failed()) {
            return null;
        }

        $games = $response->json('response.games', []);

        return collect($games)->sum('playtime_2weeks') ?: null;
    }

    /**
     * @return array{skill_level?: int, faceit_elo?: int, region?: string, player_id?: string, lifetime_matches?: int, lifetime_win_rate?: int, lifetime_avg_kd?: float}
     */
    private function fetchFaceitStats(string $steamId): array
    {
        $key = config('services.faceit.key');

        if (! $key) {
            return [];
        }

        $response = Http::withToken($key)->get('https://open.faceit.com/data/v4/players', [
            'game' => 'cs2',
            'game_player_id' => $steamId,
        ]);

        if ($response->failed()) {
            return [];
        }

        $cs2 = $response->json('games.cs2', []);
        $playerId = $response->json('player_id');

        $stats = [
            'skill_level' => $cs2['skill_level'] ?? null,
            'faceit_elo' => $cs2['faceit_elo'] ?? null,
            'region' => $cs2['region'] ?? null,
            'player_id' => $playerId,
        ];

        if ($playerId) {
            $stats = [...$stats, ...$this->fetchFaceitLifetimeStats($playerId)];
        }

        return $stats;
    }

    /**
     * FACEIT's own lifetime aggregate for the player's whole CS2 history —
     * shown as "lifetime" rather than "season" because the Data API has no
     * season concept for regular matchmaking (the season/season_id query
     * params only exist on league/hub competition endpoints), so there's
     * no boundary the API can slice these numbers to.
     *
     * @return array{lifetime_matches?: int, lifetime_win_rate?: int, lifetime_avg_kd?: float}
     */
    private function fetchFaceitLifetimeStats(string $faceitPlayerId): array
    {
        $key = config('services.faceit.key');

        if (! $key) {
            return [];
        }

        $response = Http::withToken($key)->get("https://open.faceit.com/data/v4/players/{$faceitPlayerId}/stats/cs2");

        if ($response->failed()) {
            return [];
        }

        $lifetime = $response->json('lifetime', []);

        return [
            'lifetime_matches' => isset($lifetime['Matches']) ? (int) $lifetime['Matches'] : null,
            'lifetime_win_rate' => isset($lifetime['Win Rate %']) ? (int) $lifetime['Win Rate %'] : null,
            'lifetime_avg_kd' => isset($lifetime['Average K/D Ratio']) ? (float) $lifetime['Average K/D Ratio'] : null,
        ];
    }

    /**
     * Recent match results, kept as individual rows (unlike the
     * snapshot-style PlayerStat fields above, which are overwritten every
     * refresh) so a player's page can show a history rather than just
     * their latest state.
     *
     * This is two calls per match, not one: the player-scoped history
     * endpoint (verified against the live API — /players/{id}/games/{game}
     * /stats/history, which looked plausible from the docs, actually 404s)
     * only returns the match list plus each faction's roster and final
     * score, not map or a per-player kill/death line. Those live on
     * /matches/{match_id}/stats instead. To keep the per-refresh request
     * count bounded, that second call is only made the first time a match
     * is seen — a finished match's map and stat line never change, so
     * there's nothing to gain from re-fetching it on every 5-minute cycle.
     */
    private function refreshFaceitMatchHistory(User $user, string $faceitPlayerId): void
    {
        $key = config('services.faceit.key');

        if (! $key) {
            return;
        }

        $response = Http::withToken($key)->get(
            "https://open.faceit.com/data/v4/players/{$faceitPlayerId}/history",
            ['game' => 'cs2', 'limit' => self::MATCH_HISTORY_LIMIT],
        );

        if ($response->failed()) {
            Log::warning('Faceit match history fetch failed', ['status' => $response->status()]);

            return;
        }

        $existingMatchIds = FaceitMatch::where('user_id', $user->id)->pluck('faceit_match_id')->all();

        foreach ($response->json('items', []) as $item) {
            $matchId = $item['match_id'] ?? null;

            if (! $matchId) {
                continue;
            }

            $faction = $this->faceitPlayerFaction($item['teams'] ?? [], $faceitPlayerId);

            if (! $faction) {
                continue;
            }

            $oppositeFaction = $faction === 'faction1' ? 'faction2' : 'faction1';
            $ownScore = $item['results']['score'][$faction] ?? null;
            $oppScore = $item['results']['score'][$oppositeFaction] ?? null;

            $attributes = [
                'result' => ($item['results']['winner'] ?? null) === $faction,
                'score' => ($ownScore !== null && $oppScore !== null) ? "{$ownScore} / {$oppScore}" : null,
                'played_at' => isset($item['started_at']) ? Carbon::createFromTimestamp($item['started_at']) : null,
                'fetched_at' => now(),
            ];

            if (! in_array($matchId, $existingMatchIds, true)) {
                $attributes = [...$attributes, ...$this->fetchFaceitMatchPlayerStats($matchId, $faceitPlayerId)];
            }

            FaceitMatch::updateOrCreate(['user_id' => $user->id, 'faceit_match_id' => $matchId], $attributes);
        }
    }

    /**
     * @param  array<string, mixed>  $teams
     */
    private function faceitPlayerFaction(array $teams, string $faceitPlayerId): ?string
    {
        foreach (['faction1', 'faction2'] as $faction) {
            foreach ($teams[$faction]['players'] ?? [] as $player) {
                if (($player['player_id'] ?? null) === $faceitPlayerId) {
                    return $faction;
                }
            }
        }

        return null;
    }

    /**
     * @return array{map: string, kills?: int, deaths?: int, assists?: int, kd_ratio?: float}
     */
    private function fetchFaceitMatchPlayerStats(string $matchId, string $faceitPlayerId): array
    {
        $key = config('services.faceit.key');

        if (! $key) {
            return ['map' => 'Unknown'];
        }

        $response = Http::withToken($key)->get("https://open.faceit.com/data/v4/matches/{$matchId}/stats");

        if ($response->failed()) {
            return ['map' => 'Unknown'];
        }

        $round = $response->json('rounds.0', []);
        $map = $round['round_stats']['Map'] ?? 'Unknown';

        foreach ($round['teams'] ?? [] as $team) {
            foreach ($team['players'] ?? [] as $player) {
                if (($player['player_id'] ?? null) !== $faceitPlayerId) {
                    continue;
                }

                $stats = $player['player_stats'] ?? [];

                return [
                    'map' => $map,
                    'kills' => isset($stats['Kills']) ? (int) $stats['Kills'] : null,
                    'deaths' => isset($stats['Deaths']) ? (int) $stats['Deaths'] : null,
                    'assists' => isset($stats['Assists']) ? (int) $stats['Assists'] : null,
                    'kd_ratio' => isset($stats['K/D Ratio']) ? (float) $stats['K/D Ratio'] : null,
                ];
            }
        }

        return ['map' => $map];
    }
}
