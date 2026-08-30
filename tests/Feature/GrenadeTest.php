<?php

use App\Models\Grenade;
use App\Models\GrenadeScreenshot;
use App\Models\Team;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

function validGrenadePayload(array $overrides = []): array
{
    return array_merge([
        'map' => 'mirage',
        'name' => 'CT smoke from spawn',
        'setpos' => 'setpos 100 200 300',
        'description' => 'Blocks connector.',
        'video_link' => null,
        'side' => 'T',
        'throw_button' => 'left',
        'stance' => 'standing',
        'movement' => 'standing',
        'jump' => 'standing',
        'type' => 'smoke',
    ], $overrides);
}

test('a user with no team is redirected to team join from grenades', function () {
    $user = User::factory()->create(['team_id' => null]);

    $response = $this->actingAs($user)->get('/team/grenades');

    $response->assertRedirect(route('team.join'));
});

test('index shows curated maps with counts and custom maps with entries', function () {
    $team = Team::factory()->create();
    $user = User::factory()->create(['team_id' => $team->id]);
    Grenade::factory()->count(2)->create(['team_id' => $team->id, 'map' => 'mirage']);
    Grenade::factory()->create(['team_id' => $team->id, 'map' => 'some custom map']);

    $response = $this->actingAs($user)->get('/team/grenades');

    $response->assertInertia(function ($page) {
        $page->component('team/grenades/index');
        $maps = collect($page->toArray()['props']['maps']);
        expect($maps->firstWhere('slug', 'mirage')['count'])->toBe(2);
        expect($maps->firstWhere('slug', 'inferno')['count'])->toBe(0);

        $custom = collect($page->toArray()['props']['customMaps']);
        expect($custom->firstWhere('slug', 'some custom map')['count'])->toBe(1);
    });
});

test('a custom map name matching a curated map reuses its overview image', function () {
    $team = Team::factory()->create();
    $user = User::factory()->create(['team_id' => $team->id]);
    Grenade::factory()->create(['team_id' => $team->id, 'map' => 'de_dust2']);
    Grenade::factory()->create(['team_id' => $team->id, 'map' => 'Totally Unrelated Map']);

    $response = $this->actingAs($user)->get('/team/grenades');

    $response->assertInertia(function ($page) {
        $curatedDust2Overview = collect(config('maps'))->firstWhere('slug', 'dust2')['overview'];
        $custom = collect($page->toArray()['props']['customMaps']);

        expect($custom->firstWhere('slug', 'de_dust2')['overview'])->toBe($curatedDust2Overview);
        expect($custom->firstWhere('slug', 'Totally Unrelated Map')['overview'])->toBeNull();
    });
});

test('the selected map\'s lineups scope strictly to the caller\'s team', function () {
    $teamA = Team::factory()->create();
    $teamB = Team::factory()->create();
    $userA = User::factory()->create(['team_id' => $teamA->id]);
    Grenade::factory()->create(['team_id' => $teamA->id, 'map' => 'mirage', 'name' => 'Team A lineup']);
    Grenade::factory()->create(['team_id' => $teamB->id, 'map' => 'mirage', 'name' => 'Team B lineup']);

    $response = $this->actingAs($userA)->get('/team/grenades?map=mirage');

    $response->assertInertia(function ($page) {
        $page->component('team/grenades/index')->where('selectedMap.slug', 'mirage');
        $names = collect($page->toArray()['props']['grenades'])->pluck('name');
        expect($names)->toContain('Team A lineup');
        expect($names)->not->toContain('Team B lineup');
    });
});

test('the index defaults to the first curated map when none is selected', function () {
    $user = User::factory()->create(['team_id' => Team::factory()->create()->id]);

    $response = $this->actingAs($user)->get('/team/grenades');

    $response->assertInertia(fn ($page) => $page->component('team/grenades/index')->where('selectedMap.slug', 'ancient'));
});

test('a team member can create a grenade with screenshots', function () {
    Storage::fake('public');
    $team = Team::factory()->create();
    $user = User::factory()->create(['team_id' => $team->id]);

    $response = $this->actingAs($user)->post('/team/grenades', validGrenadePayload([
        'screenshots' => [
            UploadedFile::fake()->create('one.jpg', 10, 'image/jpeg'),
            UploadedFile::fake()->create('two.jpg', 10, 'image/jpeg'),
        ],
    ]));

    $response->assertRedirect(route('team.grenades.index', ['map' => 'mirage']));
    $grenade = Grenade::first();
    expect($grenade)->not->toBeNull();
    expect($grenade->team_id)->toBe($team->id);
    expect($grenade->user_id)->toBe($user->id);
    expect($grenade->screenshots)->toHaveCount(2);
    foreach ($grenade->screenshots as $screenshot) {
        Storage::disk('public')->assertExists($screenshot->path);
    }
});

test('creating a grenade validates required fields', function () {
    $user = User::factory()->create(['team_id' => Team::factory()->create()->id]);

    $response = $this->actingAs($user)->post('/team/grenades', []);

    $response->assertSessionHasErrors(['map', 'name', 'side', 'throw_button', 'stance', 'movement', 'jump', 'type']);
    $response->assertSessionDoesntHaveErrors('setpos');
});

test('a grenade can be created without a setpos command', function () {
    $user = User::factory()->create(['team_id' => Team::factory()->create()->id]);

    $response = $this->actingAs($user)->post('/team/grenades', validGrenadePayload(['setpos' => null]));

    $response->assertSessionDoesntHaveErrors();
    expect(Grenade::first()->setpos)->toBeNull();
});

test('creating a grenade rejects more than 3 screenshots', function () {
    Storage::fake('public');
    $user = User::factory()->create(['team_id' => Team::factory()->create()->id]);

    $response = $this->actingAs($user)->post('/team/grenades', validGrenadePayload([
        'screenshots' => [
            UploadedFile::fake()->create('one.jpg', 10, 'image/jpeg'),
            UploadedFile::fake()->create('two.jpg', 10, 'image/jpeg'),
            UploadedFile::fake()->create('three.jpg', 10, 'image/jpeg'),
            UploadedFile::fake()->create('four.jpg', 10, 'image/jpeg'),
        ],
    ]));

    $response->assertSessionHasErrors('screenshots');
});

test('an "other" map is stored as the trimmed custom name', function () {
    $user = User::factory()->create(['team_id' => Team::factory()->create()->id]);

    $this->actingAs($user)->post('/team/grenades', validGrenadePayload([
        'map' => 'other',
        'custom_map_name' => '  Community Map  ',
    ]));

    expect(Grenade::first()->map)->toBe('Community Map');
});

test('any team member (not just the owner) can update another member\'s grenade', function () {
    $team = Team::factory()->create();
    $owner = User::factory()->create(['team_id' => $team->id, 'role' => 'owner']);
    $member = User::factory()->create(['team_id' => $team->id, 'role' => 'member']);
    $grenade = Grenade::factory()->create(['team_id' => $team->id, 'user_id' => $owner->id, 'map' => 'mirage']);

    $response = $this->actingAs($member)->post("/team/grenades/{$grenade->id}", [
        ...validGrenadePayload(['name' => 'Updated name']),
        '_method' => 'put',
    ]);

    $response->assertRedirect(route('team.grenades.index', ['map' => 'mirage']));
    expect($grenade->fresh()->name)->toBe('Updated name');
});

test('a grenade cannot be edited by a member of a different team', function () {
    $teamA = Team::factory()->create();
    $teamB = Team::factory()->create();
    $userB = User::factory()->create(['team_id' => $teamB->id]);
    $grenade = Grenade::factory()->create(['team_id' => $teamA->id]);

    $response = $this->actingAs($userB)->post("/team/grenades/{$grenade->id}", [
        ...validGrenadePayload(),
        '_method' => 'put',
    ]);

    $response->assertForbidden();
});

test('destroying a grenade removes its screenshots and files', function () {
    Storage::fake('public');
    $team = Team::factory()->create();
    $user = User::factory()->create(['team_id' => $team->id]);
    $grenade = Grenade::factory()->create(['team_id' => $team->id]);
    $screenshot = GrenadeScreenshot::factory()->create(['grenade_id' => $grenade->id, 'path' => 'grenade-screenshots/x.jpg']);
    Storage::disk('public')->put($screenshot->path, 'fake-contents');

    $response = $this->actingAs($user)->delete("/team/grenades/{$grenade->id}");

    $response->assertRedirect(route('team.grenades.index', ['map' => $grenade->map]));
    expect(Grenade::find($grenade->id))->toBeNull();
    expect(GrenadeScreenshot::find($screenshot->id))->toBeNull();
    Storage::disk('public')->assertMissing($screenshot->path);
});

test('deleting a single screenshot is forbidden for a non-team-member', function () {
    $teamA = Team::factory()->create();
    $teamB = Team::factory()->create();
    $userB = User::factory()->create(['team_id' => $teamB->id]);
    $grenade = Grenade::factory()->create(['team_id' => $teamA->id]);
    $screenshot = GrenadeScreenshot::factory()->create(['grenade_id' => $grenade->id]);

    $response = $this->actingAs($userB)->delete("/team/grenades/{$grenade->id}/screenshots/{$screenshot->id}");

    $response->assertForbidden();
});
