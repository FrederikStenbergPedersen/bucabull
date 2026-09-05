<?php

namespace App\Jobs;

use App\Models\PlayerStat;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * The cheap, frequent half of the roster refresh: every active team
 * member's Steam online status. One batched GetPlayerSummaries call per
 * 100 players, so the request count barely grows with the number of
 * teams. The expensive per-player FACEIT/playtime work is
 * RefreshRosterStatsJob on a slower rolling schedule.
 */
class RefreshPresenceJob implements ShouldQueue
{
    use Queueable;

    // Steam's GetPlayerSummaries accepts up to 100 steamids per call.
    private const STEAM_ID_BATCH = 100;

    /**
     * @param  User|null  $user  refresh only this player (e.g. straight
     *                           after they log in) instead of the whole
     *                           active-team roster.
     */
    public function __construct(public readonly ?User $user = null) {}

    public function handle(): void
    {
        $key = config('services.steam.client_secret');

        if (! $key) {
            return;
        }

        $users = $this->user
            ? collect([$this->user])->filter(fn (User $user) => $user->steam_id !== null)->values()
            : User::query()
                ->whereNotNull('steam_id')
                ->whereHas('team', fn ($query) => $query->active())
                ->get(['id', 'steam_id']);

        if ($users->isEmpty()) {
            return;
        }

        foreach ($users->chunk(self::STEAM_ID_BATCH) as $chunk) {
            $summaries = $this->fetchSummaries($key, $chunk->pluck('steam_id')->all());

            // A transient Steam failure leaves the existing snapshot in
            // place rather than blanking everyone's status to "unknown".
            if ($summaries === null) {
                continue;
            }

            foreach ($chunk as $user) {
                $summary = $summaries[$user->steam_id] ?? null;

                PlayerStat::updateOrCreate(
                    ['user_id' => $user->id],
                    [
                        'steam_persona_state' => $summary['personastate'] ?? null,
                        'steam_last_seen_at' => isset($summary['lastlogoff'])
                            ? Carbon::createFromTimestamp($summary['lastlogoff'])
                            : null,
                        'presence_synced_at' => now(),
                    ],
                );
            }
        }
    }

    /**
     * @param  list<string>  $steamIds
     * @return array<string, array<string, mixed>>|null keyed by steamid, or null if the call failed
     */
    private function fetchSummaries(string $key, array $steamIds): ?array
    {
        $response = Http::retry(2, 500, throw: false)
            ->get('https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/', [
                'key' => $key,
                'steamids' => implode(',', $steamIds),
            ]);

        if ($response->failed()) {
            Log::warning('Steam GetPlayerSummaries failed', ['status' => $response->status()]);

            return null;
        }

        return collect($response->json('response.players', []))->keyBy('steamid')->all();
    }
}
