<?php

use App\Jobs\RefreshPresenceJob;
use App\Models\PlayerStat;
use App\Models\Team;
use App\Models\User;
use Illuminate\Support\Facades\Http;

beforeEach(function () {
    config()->set('services.steam.client_secret', 'steam-test-key');
});

function steamSummaryResponse(array $players): array
{
    return ['response' => ['players' => $players]];
}

test('it stores presence for players on active teams', function () {
    Http::fake([
        'api.steampowered.com/*' => Http::response(steamSummaryResponse([
            ['steamid' => '76561190000000001', 'personastate' => 1, 'lastlogoff' => 1_700_000_000],
        ])),
    ]);

    $team = Team::factory()->create(['last_active_at' => now()]);
    $user = User::factory()->create(['team_id' => $team->id, 'steam_id' => '76561190000000001']);

    (new RefreshPresenceJob)->handle();

    $stat = PlayerStat::where('user_id', $user->id)->sole();
    expect($stat->steam_persona_state)->toBe(1);
    expect($stat->steam_last_seen_at)->not->toBeNull();
    expect($stat->presence_synced_at)->not->toBeNull();
});

test('it never calls Steam for players whose team fell outside the active window', function () {
    Http::fake();
    Http::preventStrayRequests();

    $team = Team::factory()->create(['last_active_at' => now()->subDays(config('roster.active_team_days') + 1)]);
    User::factory()->create(['team_id' => $team->id]);

    (new RefreshPresenceJob)->handle();

    Http::assertNothingSent();
    expect(PlayerStat::count())->toBe(0);
});

test('it batches steamids at 100 per request', function () {
    Http::fake(['api.steampowered.com/*' => Http::response(steamSummaryResponse([]))]);

    $team = Team::factory()->create(['last_active_at' => now()]);
    User::factory()->count(150)->create(['team_id' => $team->id]);

    (new RefreshPresenceJob)->handle();

    Http::assertSentCount(2);
});

test('a Steam outage leaves existing presence untouched instead of blanking it', function () {
    Http::fake(['api.steampowered.com/*' => Http::response('upstream error', 500)]);

    $team = Team::factory()->create(['last_active_at' => now()]);
    $user = User::factory()->create(['team_id' => $team->id]);
    $stat = PlayerStat::factory()->create(['user_id' => $user->id, 'steam_persona_state' => 1]);

    (new RefreshPresenceJob)->handle();

    expect($stat->fresh()->steam_persona_state)->toBe(1);
});

test('it can refresh a single player, ignoring the active-team filter', function () {
    Http::fake([
        'api.steampowered.com/*' => Http::response(steamSummaryResponse([
            ['steamid' => '76561190000000009', 'personastate' => 3],
        ])),
    ]);

    $team = Team::factory()->create(['last_active_at' => now()->subYear()]);
    $user = User::factory()->create(['team_id' => $team->id, 'steam_id' => '76561190000000009']);

    (new RefreshPresenceJob($user))->handle();

    expect(PlayerStat::where('user_id', $user->id)->sole()->steam_persona_state)->toBe(3);
});
