<?php

use App\Models\Strategy;
use App\Models\Team;
use App\Models\User;

function validStrategyPayload(array $overrides = []): array
{
    return array_merge([
        'map' => 'mirage',
        'name' => 'A site default',
        'types' => ['buyround'],
        'side' => 'T',
        'note' => 'Standard default setup.',
        'video_link' => null,
        'description' => 'Everyone stacks A.',
    ], $overrides);
}

test('a user with no team is redirected to team join from strategies', function () {
    $user = User::factory()->create(['team_id' => null]);

    $response = $this->actingAs($user)->get('/team/strategies');

    $response->assertRedirect(route('team.join'));
});

test('index shows curated maps with counts and custom maps with entries', function () {
    $team = Team::factory()->create();
    $user = User::factory()->create(['team_id' => $team->id]);
    Strategy::factory()->count(2)->create(['team_id' => $team->id, 'map' => 'mirage']);
    Strategy::factory()->create(['team_id' => $team->id, 'map' => 'some custom map']);

    $response = $this->actingAs($user)->get('/team/strategies');

    $response->assertInertia(function ($page) {
        $page->component('team/strategies/index');
        $maps = collect($page->toArray()['props']['maps']);
        expect($maps->firstWhere('slug', 'mirage')['count'])->toBe(2);
        expect($maps->firstWhere('slug', 'inferno')['count'])->toBe(0);

        $custom = collect($page->toArray()['props']['customMaps']);
        expect($custom->firstWhere('slug', 'some custom map')['count'])->toBe(1);
    });
});

test('the selected map\'s strategies scope strictly to the caller\'s team', function () {
    $teamA = Team::factory()->create();
    $teamB = Team::factory()->create();
    $userA = User::factory()->create(['team_id' => $teamA->id]);
    Strategy::factory()->create(['team_id' => $teamA->id, 'map' => 'mirage', 'name' => 'Team A strat']);
    Strategy::factory()->create(['team_id' => $teamB->id, 'map' => 'mirage', 'name' => 'Team B strat']);

    $response = $this->actingAs($userA)->get('/team/strategies?map=mirage');

    $response->assertInertia(function ($page) {
        $page->component('team/strategies/index')->where('selectedMap.slug', 'mirage');
        $names = collect($page->toArray()['props']['strategies'])->pluck('name');
        expect($names)->toContain('Team A strat');
        expect($names)->not->toContain('Team B strat');
    });
});

test('a team member can create a strategy', function () {
    $team = Team::factory()->create();
    $user = User::factory()->create(['team_id' => $team->id]);

    $response = $this->actingAs($user)->post('/team/strategies', validStrategyPayload());

    $response->assertRedirect(route('team.strategies.index', ['map' => 'mirage']));
    $strategy = Strategy::first();
    expect($strategy)->not->toBeNull();
    expect($strategy->team_id)->toBe($team->id);
    expect($strategy->user_id)->toBe($user->id);
    expect($strategy->types)->toBe(['buyround']);
});

test('creating a strategy validates required fields', function () {
    $user = User::factory()->create(['team_id' => Team::factory()->create()->id]);

    $response = $this->actingAs($user)->post('/team/strategies', []);

    $response->assertSessionHasErrors(['map', 'name', 'types', 'side']);
    $response->assertSessionDoesntHaveErrors(['note', 'video_link', 'description']);
});

test('creating a strategy accepts multiple types', function () {
    $user = User::factory()->create(['team_id' => Team::factory()->create()->id]);

    $this->actingAs($user)->post('/team/strategies', validStrategyPayload(['types' => ['buyround', 'force']]));

    expect(Strategy::first()->types)->toBe(['buyround', 'force']);
});

test('creating a strategy rejects an invalid type', function () {
    $user = User::factory()->create(['team_id' => Team::factory()->create()->id]);

    $response = $this->actingAs($user)->post('/team/strategies', validStrategyPayload(['types' => ['not-a-type']]));

    $response->assertSessionHasErrors('types.0');
});

test('an "other" map is stored as the trimmed custom name', function () {
    $user = User::factory()->create(['team_id' => Team::factory()->create()->id]);

    $this->actingAs($user)->post('/team/strategies', validStrategyPayload([
        'map' => 'other',
        'custom_map_name' => '  Community Map  ',
    ]));

    expect(Strategy::first()->map)->toBe('Community Map');
});

test('any team member (not just the owner) can update another member\'s strategy', function () {
    $team = Team::factory()->create();
    $owner = User::factory()->create(['team_id' => $team->id, 'role' => 'owner']);
    $member = User::factory()->create(['team_id' => $team->id, 'role' => 'member']);
    $strategy = Strategy::factory()->create(['team_id' => $team->id, 'user_id' => $owner->id, 'map' => 'mirage']);

    $response = $this->actingAs($member)->post("/team/strategies/{$strategy->id}", [
        ...validStrategyPayload(['name' => 'Updated name']),
        '_method' => 'put',
    ]);

    $response->assertRedirect(route('team.strategies.index', ['map' => 'mirage']));
    expect($strategy->fresh()->name)->toBe('Updated name');
});

test('a strategy cannot be edited by a member of a different team', function () {
    $teamA = Team::factory()->create();
    $teamB = Team::factory()->create();
    $userB = User::factory()->create(['team_id' => $teamB->id]);
    $strategy = Strategy::factory()->create(['team_id' => $teamA->id]);

    $response = $this->actingAs($userB)->post("/team/strategies/{$strategy->id}", [
        ...validStrategyPayload(),
        '_method' => 'put',
    ]);

    $response->assertForbidden();
});

test('a strategy cannot be deleted by a member of a different team', function () {
    $teamA = Team::factory()->create();
    $teamB = Team::factory()->create();
    $userB = User::factory()->create(['team_id' => $teamB->id]);
    $strategy = Strategy::factory()->create(['team_id' => $teamA->id]);

    $response = $this->actingAs($userB)->delete("/team/strategies/{$strategy->id}");

    $response->assertForbidden();
});

test('destroying a strategy removes it', function () {
    $team = Team::factory()->create();
    $user = User::factory()->create(['team_id' => $team->id]);
    $strategy = Strategy::factory()->create(['team_id' => $team->id]);

    $response = $this->actingAs($user)->delete("/team/strategies/{$strategy->id}");

    $response->assertRedirect(route('team.strategies.index', ['map' => $strategy->map]));
    expect(Strategy::find($strategy->id))->toBeNull();
});
