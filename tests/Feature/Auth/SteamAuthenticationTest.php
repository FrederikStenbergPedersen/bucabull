<?php

use App\Jobs\RefreshRosterStatsJob;
use App\Models\Team;
use App\Models\User;
use Illuminate\Support\Facades\Queue;
use Laravel\Socialite\Contracts\Provider;
use Laravel\Socialite\Facades\Socialite;
use Laravel\Socialite\Two\User as SocialiteUser;

beforeEach(function () {
    Queue::fake();
});

function fakeSteamUser(string $steamId, string $nickname = 'Tester'): void
{
    $socialiteUser = (new SocialiteUser)->setRaw([])->map([
        'id' => $steamId,
        'nickname' => $nickname,
        'name' => null,
        'email' => null,
        'avatar' => 'https://example.com/avatar.jpg',
    ]);

    $provider = Mockery::mock(Provider::class);
    $provider->shouldReceive('user')->andReturn($socialiteUser);

    Socialite::shouldReceive('driver')->with('steam')->andReturn($provider);
}

test('a new steam login creates a user and sends them to team join', function () {
    fakeSteamUser('76561197960265729', 'NewPlayer');

    $response = $this->get('/auth/steam/callback');

    $response->assertRedirect(route('team.join'));
    $this->assertAuthenticated();
    expect(User::where('steam_id', '76561197960265729')->first())
        ->nickname->toBe('NewPlayer')
        ->team_id->toBeNull();
    Queue::assertPushed(RefreshRosterStatsJob::class);
});

test('a returning steam login with a team goes to the home page', function () {
    $team = Team::factory()->create();
    $user = User::factory()->create(['steam_id' => '76561197960265730', 'team_id' => $team->id]);

    fakeSteamUser('76561197960265730', $user->nickname);

    $response = $this->get('/auth/steam/callback');

    $response->assertRedirect(route('home'));
    $this->assertAuthenticatedAs($user);
});

test('logging out clears the session', function () {
    $user = User::factory()->create();
    $this->actingAs($user);

    $response = $this->post('/logout');

    $response->assertRedirect('/');
    $this->assertGuest();
});
