<?php

use App\Models\Team;
use App\Models\User;

test('a user with no team is redirected to team join from home', function () {
    $user = User::factory()->create(['team_id' => null]);

    $response = $this->actingAs($user)->get('/');

    $response->assertRedirect(route('team.join'));
});

test('a user can create a team and becomes its owner', function () {
    $user = User::factory()->create(['team_id' => null]);

    $response = $this->actingAs($user)->post('/team', ['name' => 'Test Squad']);

    $response->assertRedirect(route('home'));
    $user->refresh();
    expect($user->role)->toBe('owner');
    expect($user->team)->not->toBeNull();
    expect($user->team->name)->toBe('Test Squad');
    expect($user->team->owner_id)->toBe($user->id);
});

test('a user can join an existing team via invite code', function () {
    $team = Team::factory()->create();
    $user = User::factory()->create(['team_id' => null]);

    $response = $this->actingAs($user)->post('/team/join', ['invite_code' => $team->invite_code]);

    $response->assertRedirect(route('home'));
    $user->refresh();
    expect($user->team_id)->toBe($team->id);
    expect($user->role)->toBe('member');
});

test('joining with an invalid invite code fails validation', function () {
    $user = User::factory()->create(['team_id' => null]);

    $response = $this->actingAs($user)->post('/team/join', ['invite_code' => 'NOTREAL']);

    $response->assertSessionHasErrors('invite_code');
    $user->refresh();
    expect($user->team_id)->toBeNull();
});

test('a guest sees the landing hero when no home team exists yet', function () {
    config(['app.home_team_slug' => 'bucabull']);

    $response = $this->get('/');

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page->component('home')->where('team', null)->where('isOwnTeam', false));
});

test('the home page shows the home team to a logged-out visitor', function () {
    Team::factory()->create(['slug' => 'bucabull', 'name' => 'Bucabull eSports']);
    config(['app.home_team_slug' => 'bucabull']);

    $response = $this->get('/');

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page->component('home')->where('team.name', 'Bucabull eSports')->where('isOwnTeam', false));
});

test('the home page shows the viewer\'s own team when logged in', function () {
    Team::factory()->create(['slug' => 'bucabull']);
    $ownTeam = Team::factory()->create(['name' => 'My Own Team']);
    $user = User::factory()->create(['team_id' => $ownTeam->id]);
    config(['app.home_team_slug' => 'bucabull']);

    $response = $this->actingAs($user)->get('/');

    $response->assertInertia(fn ($page) => $page->component('home')->where('team.name', 'My Own Team')->where('isOwnTeam', true));
});
