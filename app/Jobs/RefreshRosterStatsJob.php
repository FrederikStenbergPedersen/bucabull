<?php

namespace App\Jobs;

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
                    'fetched_at' => now(),
                ],
            );
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
     * @return array{skill_level?: int, faceit_elo?: int, region?: string}
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

        return [
            'skill_level' => $cs2['skill_level'] ?? null,
            'faceit_elo' => $cs2['faceit_elo'] ?? null,
            'region' => $cs2['region'] ?? null,
        ];
    }
}
