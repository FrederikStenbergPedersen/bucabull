<?php

namespace App\Jobs;

use App\Models\FaceitMatch;
use App\Models\PlayerStat;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\RequestException;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * The expensive half of the roster refresh: recent playtime plus every
 * FACEIT call (profile, lifetime aggregate, match history). Steam online
 * status is RefreshPresenceJob's job — cheaper and more frequent.
 *
 * Scaling is handled two ways so the outbound request count stays bounded
 * no matter how many teams sign up:
 *
 *  - Only players on teams active within config('roster.active_team_days')
 *    are considered at all.
 *  - Of those, only the config('roster.stats_batch_size') stalest are
 *    refreshed per run (stalest-first via stats_synced_at). A backlog just
 *    means a given player refreshes every few cycles instead of every
 *    cycle — freshness degrades gracefully rather than the API getting
 *    hammered.
 *
 * On top of that, a per-run FACEIT request budget stops the job cleanly
 * mid-batch if FACEIT is rate-limiting; the un-refreshed players keep
 * their old stats_synced_at and get picked up next cycle.
 */
class RefreshRosterStatsJob implements ShouldQueue
{
    use Queueable;

    private const MATCH_HISTORY_LIMIT = 20;

    private int $faceitRequests = 0;

    /**
     * @param  User|null  $user  refresh only this player (e.g. straight
     *                           after they log in) instead of the rolling
     *                           stalest-first batch.
     */
    public function __construct(public readonly ?User $user = null) {}

    public function handle(): void
    {
        $budget = config('roster.faceit_max_requests_per_run');

        $players = $this->user ? collect([$this->user]) : $this->stalestPlayers();

        foreach ($players as $user) {
            if (! $user->steam_id) {
                continue;
            }

            if ($this->faceitRequests >= $budget) {
                Log::info('RefreshRosterStatsJob hit its FACEIT request budget, stopping early', [
                    'requests' => $this->faceitRequests,
                ]);
                break;
            }

            $playtime = $this->fetchRecentPlaytime($user->steam_id);
            $faceit = $this->fetchFaceitStats($user->steam_id);

            PlayerStat::updateOrCreate(
                ['user_id' => $user->id],
                [
                    'playtime_2weeks_minutes' => $playtime,
                    'faceit_skill_level' => $faceit['skill_level'] ?? null,
                    'faceit_elo' => $faceit['faceit_elo'] ?? null,
                    'faceit_region' => $faceit['region'] ?? null,
                    'faceit_player_id' => $faceit['player_id'] ?? null,
                    'faceit_lifetime_matches' => $faceit['lifetime_matches'] ?? null,
                    'faceit_lifetime_win_rate' => $faceit['lifetime_win_rate'] ?? null,
                    'faceit_lifetime_avg_kd' => $faceit['lifetime_avg_kd'] ?? null,
                    'stats_synced_at' => now(),
                ],
            );

            if (! empty($faceit['player_id'])) {
                $this->refreshFaceitMatchHistory($user, $faceit['player_id']);
            }
        }
    }

    /**
     * Players on active teams whose stats are missing or older than the
     * TTL, stalest first. `stats_synced_at IS NULL` is ordered ahead of
     * any timestamp (portable across SQLite and Postgres, which disagree
     * on default NULL ordering).
     *
     * @return Collection<int, User>
     */
    private function stalestPlayers(): Collection
    {
        $cutoff = now()->subMinutes(config('roster.stats_ttl_minutes'));

        return User::query()
            ->whereNotNull('users.steam_id')
            ->whereHas('team', fn ($query) => $query->active())
            ->leftJoin('player_stats', 'player_stats.user_id', '=', 'users.id')
            ->where(fn ($query) => $query
                ->whereNull('player_stats.stats_synced_at')
                ->orWhere('player_stats.stats_synced_at', '<', $cutoff))
            ->orderByRaw('player_stats.stats_synced_at is null desc')
            ->orderBy('player_stats.stats_synced_at')
            ->limit(config('roster.stats_batch_size'))
            ->select('users.*')
            ->get();
    }

    private function fetchRecentPlaytime(string $steamId): ?int
    {
        $key = config('services.steam.client_secret');

        if (! $key) {
            return null;
        }

        $response = Http::retry(2, 500, throw: false)
            ->get('https://api.steampowered.com/IPlayerService/GetRecentlyPlayedGames/v1/', [
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
        $response = $this->faceitGet('https://open.faceit.com/data/v4/players', [
            'game' => 'cs2',
            'game_player_id' => $steamId,
        ]);

        if (! $response || $response->failed()) {
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
        $response = $this->faceitGet("https://open.faceit.com/data/v4/players/{$faceitPlayerId}/stats/cs2");

        if (! $response || $response->failed()) {
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
     * endpoint only returns the match list plus each faction's roster and
     * final score, not map or a per-player kill/death line. Those live on
     * /matches/{match_id}/stats instead. To keep the per-refresh request
     * count bounded, that second call is only made the first time a match
     * is seen — a finished match's map and stat line never change.
     */
    private function refreshFaceitMatchHistory(User $user, string $faceitPlayerId): void
    {
        $response = $this->faceitGet(
            "https://open.faceit.com/data/v4/players/{$faceitPlayerId}/history",
            ['game' => 'cs2', 'limit' => self::MATCH_HISTORY_LIMIT],
        );

        if (! $response || $response->failed()) {
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
        $response = $this->faceitGet("https://open.faceit.com/data/v4/matches/{$matchId}/stats");

        if (! $response || $response->failed()) {
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

    /**
     * Every FACEIT Data API call goes through here: it counts the request
     * against this run's budget and retries transient failures (including
     * 429) with backoff. Returns null once a call fails outright, and the
     * per-endpoint callers above degrade gracefully on null — a missing
     * field just isn't updated this cycle.
     *
     * @param  array<string, mixed>  $query
     */
    private function faceitGet(string $url, array $query = []): ?Response
    {
        $key = config('services.faceit.key');

        if (! $key) {
            return null;
        }

        $this->faceitRequests++;

        return Http::withToken($key)
            ->retry(3, 1000, when: fn (Throwable $e) => $e instanceof ConnectionException
                || ($e instanceof RequestException && $e->response->status() === 429), throw: false)
            ->get($url, $query);
    }
}
