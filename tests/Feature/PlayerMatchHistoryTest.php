<?php

use App\Models\FaceitMatch;
use App\Models\Team;
use App\Models\User;

test('a guest is redirected to login', function () {
    $player = User::factory()->create(['team_id' => Team::factory()->create()->id]);

    $response = $this->get("/team/players/{$player->id}");

    $response->assertRedirect(route('login'));
});

test('a user with no team is redirected to team join', function () {
    $viewer = User::factory()->create(['team_id' => null]);
    $player = User::factory()->create(['team_id' => Team::factory()->create()->id]);

    $response = $this->actingAs($viewer)->get("/team/players/{$player->id}");

    $response->assertRedirect(route('team.join'));
});

test('a teammate can view another player\'s match history, most recent first', function () {
    $team = Team::factory()->create();
    $viewer = User::factory()->create(['team_id' => $team->id]);
    $player = User::factory()->create(['team_id' => $team->id]);
    FaceitMatch::factory()->create(['user_id' => $player->id, 'map' => 'de_ancient', 'played_at' => now()->subDay()]);
    FaceitMatch::factory()->create(['user_id' => $player->id, 'map' => 'de_mirage', 'played_at' => now()]);

    $response = $this->actingAs($viewer)->get("/team/players/{$player->id}");

    $response->assertOk();
    $response->assertInertia(function ($page) {
        $page->component('team/players/show');
        $maps = collect($page->toArray()['props']['matches'])->pluck('map');
        expect($maps->all())->toBe(['de_mirage', 'de_ancient']);
    });
});

test('a player with no matches yet renders an empty list instead of erroring', function () {
    $team = Team::factory()->create();
    $viewer = User::factory()->create(['team_id' => $team->id]);
    $player = User::factory()->create(['team_id' => $team->id]);

    $response = $this->actingAs($viewer)->get("/team/players/{$player->id}");

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page->component('team/players/show')->where('matches', []));
});

test('a match history request only returns matches belonging to the requested player', function () {
    $team = Team::factory()->create();
    $viewer = User::factory()->create(['team_id' => $team->id]);
    $player = User::factory()->create(['team_id' => $team->id]);
    $teammate = User::factory()->create(['team_id' => $team->id]);
    FaceitMatch::factory()->create(['user_id' => $player->id, 'map' => 'de_mirage']);
    FaceitMatch::factory()->create(['user_id' => $teammate->id, 'map' => 'de_inferno']);

    $response = $this->actingAs($viewer)->get("/team/players/{$player->id}");

    $response->assertInertia(function ($page) {
        $maps = collect($page->toArray()['props']['matches'])->pluck('map');
        expect($maps->all())->toBe(['de_mirage']);
    });
});

test('a user on a different team cannot view the player\'s match history', function () {
    $teamA = Team::factory()->create();
    $teamB = Team::factory()->create();
    $viewer = User::factory()->create(['team_id' => $teamA->id]);
    $player = User::factory()->create(['team_id' => $teamB->id]);

    $response = $this->actingAs($viewer)->get("/team/players/{$player->id}");

    $response->assertForbidden();
});

test('a player is forbidden from viewing their own match history through this route if they somehow have no team', function () {
    $viewer = User::factory()->create(['team_id' => Team::factory()->create()->id]);
    $player = User::factory()->create(['team_id' => null]);

    $response = $this->actingAs($viewer)->get("/team/players/{$player->id}");

    $response->assertForbidden();
});
