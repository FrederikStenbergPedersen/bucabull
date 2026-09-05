<?php

use App\Jobs\RefreshRosterStatsJob;
use App\Models\FaceitMatch;
use App\Models\PlayerStat;
use App\Models\Team;
use App\Models\User;
use Illuminate\Support\Facades\Http;

beforeEach(function () {
    config()->set('services.steam.client_secret', 'steam-test-key');
    config()->set('services.faceit.key', 'faceit-test-key');
});

/**
 * The happy-path stub set. Order matters: Http::fake matches patterns in
 * insertion order, so the specific FACEIT endpoints come before the
 * catch-all `players*` profile pattern.
 */
function fakeRosterApis(array $overrides = []): void
{
    Http::fake([
        'api.steampowered.com/*' => Http::response(['response' => ['games' => [['playtime_2weeks' => 90]]]]),
        'open.faceit.com/data/v4/players/*/stats/*' => Http::response([
            'lifetime' => ['Matches' => '480', 'Win Rate %' => '52', 'Average K/D Ratio' => '1.08'],
        ]),
        'open.faceit.com/data/v4/players/*/history*' => Http::response(['items' => []]),
        'open.faceit.com/data/v4/matches/*' => Http::response(['rounds' => []]),
        'open.faceit.com/data/v4/players*' => Http::response([
            'player_id' => 'faceit-player-1',
            'games' => ['cs2' => ['skill_level' => 8, 'faceit_elo' => 2200, 'region' => 'EU']],
        ]),
        ...$overrides,
    ]);
}

function activeTeamPlayer(array $statAttributes = []): User
{
    $team = Team::factory()->create(['last_active_at' => now()]);
    $user = User::factory()->create(['team_id' => $team->id]);

    if ($statAttributes !== []) {
        PlayerStat::factory()->create([...$statAttributes, 'user_id' => $user->id]);
    }

    return $user;
}

test('it fills in FACEIT and playtime stats and stamps stats_synced_at', function () {
    fakeRosterApis();
    $user = activeTeamPlayer();

    (new RefreshRosterStatsJob)->handle();

    $stat = PlayerStat::where('user_id', $user->id)->sole();
    expect($stat->playtime_2weeks_minutes)->toBe(90);
    expect($stat->faceit_elo)->toBe(2200);
    expect($stat->faceit_lifetime_matches)->toBe(480);
    expect($stat->stats_synced_at)->not->toBeNull();
});

test('it only refreshes the stalest players up to the batch size', function () {
    fakeRosterApis();
    config()->set('roster.stats_batch_size', 2);

    $oldest = activeTeamPlayer(['stats_synced_at' => now()->subHours(3)]);
    $middle = activeTeamPlayer(['stats_synced_at' => now()->subHours(2)]);
    $newest = activeTeamPlayer(['stats_synced_at' => now()->subHours(1)]);

    (new RefreshRosterStatsJob)->handle();

    expect($oldest->playerStat->fresh()->stats_synced_at->isAfter(now()->subMinutes(2)))->toBeTrue();
    expect($middle->playerStat->fresh()->stats_synced_at->isAfter(now()->subMinutes(2)))->toBeTrue();
    expect($newest->playerStat->fresh()->stats_synced_at->isBefore(now()->subMinutes(30)))->toBeTrue();
});

test('it skips players whose stats are still within the TTL', function () {
    fakeRosterApis();
    Http::preventStrayRequests();
    config()->set('roster.stats_ttl_minutes', 20);

    activeTeamPlayer(['stats_synced_at' => now()->subMinutes(5), 'faceit_elo' => 999]);

    (new RefreshRosterStatsJob)->handle();

    Http::assertNothingSent();
});

test('it ignores players on teams outside the active window', function () {
    fakeRosterApis();
    Http::preventStrayRequests();

    $team = Team::factory()->create(['last_active_at' => now()->subYear()]);
    User::factory()->create(['team_id' => $team->id]);

    (new RefreshRosterStatsJob)->handle();

    Http::assertNothingSent();
    expect(PlayerStat::count())->toBe(0);
});

test('it stops once the per-run FACEIT request budget is spent', function () {
    fakeRosterApis();
    config()->set('roster.faceit_max_requests_per_run', 2);
    config()->set('roster.stats_batch_size', 10);

    $a = activeTeamPlayer(['stats_synced_at' => now()->subHours(3)]);
    $b = activeTeamPlayer(['stats_synced_at' => now()->subHours(2)]);

    (new RefreshRosterStatsJob)->handle();

    // First player consumes the whole budget (profile + lifetime +
    // history = 3 calls); the second is left for the next cycle.
    expect($a->playerStat->fresh()->stats_synced_at->isAfter(now()->subMinutes(2)))->toBeTrue();
    expect($b->playerStat->fresh()->stats_synced_at->isBefore(now()->subMinutes(30)))->toBeTrue();
});

test('new FACEIT matches are recorded as history rows', function () {
    fakeRosterApis([
        'open.faceit.com/data/v4/players/*/history*' => Http::response(['items' => [[
            'match_id' => 'm-1',
            'started_at' => 1_700_000_000,
            'teams' => [
                'faction1' => ['players' => [['player_id' => 'faceit-player-1']]],
                'faction2' => ['players' => [['player_id' => 'opponent']]],
            ],
            'results' => ['winner' => 'faction1', 'score' => ['faction1' => 13, 'faction2' => 7]],
        ]]]),
        'open.faceit.com/data/v4/matches/*' => Http::response([
            'rounds' => [[
                'round_stats' => ['Map' => 'de_nuke'],
                'teams' => [['players' => [[
                    'player_id' => 'faceit-player-1',
                    'player_stats' => ['Kills' => '20', 'Deaths' => '14', 'Assists' => '3', 'K/D Ratio' => '1.43'],
                ]]]],
            ]],
        ]),
    ]);

    $user = activeTeamPlayer();

    (new RefreshRosterStatsJob)->handle();

    $match = FaceitMatch::where('user_id', $user->id)->sole();
    expect($match->faceit_match_id)->toBe('m-1');
    expect($match->map)->toBe('de_nuke');
    expect($match->result)->toBeTrue();
});

test('it can refresh a single player regardless of team activity', function () {
    fakeRosterApis();

    $team = Team::factory()->create(['last_active_at' => now()->subYear()]);
    $user = User::factory()->create(['team_id' => $team->id]);

    (new RefreshRosterStatsJob($user))->handle();

    expect(PlayerStat::where('user_id', $user->id)->sole()->faceit_elo)->toBe(2200);
});
