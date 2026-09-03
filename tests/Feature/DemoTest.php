<?php

use App\Jobs\ParseDemoJob;
use App\Models\Demo;
use App\Models\FaceitMatch;
use App\Models\Team;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Storage;

function fakeDemoFile(string $name = 'match.dem'): UploadedFile
{
    return UploadedFile::fake()->createWithContent($name, 'PBDEMS2'.str_repeat('x', 1024));
}

test('uploading rejects a file without the CS2 demo header', function () {
    Storage::fake('local');
    Queue::fake();
    $team = Team::factory()->create();
    $user = User::factory()->create(['team_id' => $team->id]);
    $match = FaceitMatch::factory()->create(['user_id' => $user->id]);
    $notADemo = UploadedFile::fake()->createWithContent('match.dem', 'not a real demo file');

    $response = $this->actingAs($user)->post("/team/matches/{$match->id}/demo", ['demo' => $notADemo]);

    $response->assertSessionHasErrors('demo');
    expect(Demo::count())->toBe(0);
    Queue::assertNothingPushed();
});

test('a teammate cannot upload a demo for a match belonging to another team', function () {
    Storage::fake('local');
    $teamA = Team::factory()->create();
    $teamB = Team::factory()->create();
    $uploader = User::factory()->create(['team_id' => $teamB->id]);
    $player = User::factory()->create(['team_id' => $teamA->id]);
    $match = FaceitMatch::factory()->create(['user_id' => $player->id]);

    $response = $this->actingAs($uploader)->post("/team/matches/{$match->id}/demo", ['demo' => fakeDemoFile()]);

    $response->assertForbidden();
    expect(Demo::count())->toBe(0);
});

test('a successful upload creates one demo, stores the file, and queues parsing on the demos queue', function () {
    Storage::fake('local');
    Queue::fake();
    $team = Team::factory()->create();
    $user = User::factory()->create(['team_id' => $team->id]);
    $match = FaceitMatch::factory()->create(['user_id' => $user->id, 'faceit_match_id' => '1-abc', 'map' => 'de_mirage']);

    $response = $this->actingAs($user)->post("/team/matches/{$match->id}/demo", ['demo' => fakeDemoFile()]);

    $demo = Demo::first();
    expect($demo)->not->toBeNull();
    expect($demo->faceit_match_id)->toBe('1-abc');
    expect($demo->status)->toBe(Demo::STATUS_PROCESSING);
    expect($demo->uploaded_by_user_id)->toBe($user->id);
    Storage::disk('local')->assertExists($demo->raw_disk_path);
    Queue::assertPushedOn('demos', ParseDemoJob::class, fn ($job) => $job->demo->id === $demo->id);
    $response->assertRedirect(route('team.demos.show', $demo));
});

test('a second teammate uploading for the same real match is redirected to the existing demo instead of duplicating it', function () {
    Storage::fake('local');
    Queue::fake();
    $team = Team::factory()->create();
    $playerA = User::factory()->create(['team_id' => $team->id]);
    $playerB = User::factory()->create(['team_id' => $team->id]);
    $matchA = FaceitMatch::factory()->create(['user_id' => $playerA->id, 'faceit_match_id' => 'shared-match']);
    $matchB = FaceitMatch::factory()->create(['user_id' => $playerB->id, 'faceit_match_id' => 'shared-match']);

    $this->actingAs($playerA)->post("/team/matches/{$matchA->id}/demo", ['demo' => fakeDemoFile()]);
    expect(Demo::count())->toBe(1);

    $response = $this->actingAs($playerB)->post("/team/matches/{$matchB->id}/demo", ['demo' => fakeDemoFile()]);

    expect(Demo::count())->toBe(1);
    $response->assertRedirect(route('team.demos.show', Demo::first()));
});

test('re-uploading against a failed demo retries in place instead of creating a new row', function () {
    Storage::fake('local');
    Queue::fake();
    $team = Team::factory()->create();
    $user = User::factory()->create(['team_id' => $team->id]);
    $match = FaceitMatch::factory()->create(['user_id' => $user->id, 'faceit_match_id' => 'retry-match']);
    $failed = Demo::factory()->failed()->create(['faceit_match_id' => 'retry-match']);

    $response = $this->actingAs($user)->post("/team/matches/{$match->id}/demo", ['demo' => fakeDemoFile()]);

    expect(Demo::count())->toBe(1);
    $failed->refresh();
    expect($failed->status)->toBe(Demo::STATUS_PROCESSING);
    expect($failed->error_message)->toBeNull();
    Queue::assertPushedOn('demos', ParseDemoJob::class, fn ($job) => $job->demo->id === $failed->id);
    $response->assertRedirect(route('team.demos.show', $failed));
});

test('a teammate viewing a demo gets the match id backing it, for the retry-upload action', function () {
    $team = Team::factory()->create();
    $user = User::factory()->create(['team_id' => $team->id]);
    $match = FaceitMatch::factory()->create(['user_id' => $user->id, 'faceit_match_id' => 'match-1']);
    $demo = Demo::factory()->create(['faceit_match_id' => 'match-1']);

    $response = $this->actingAs($user)->get("/team/demos/{$demo->id}");

    $response->assertInertia(
        fn ($page) => $page->component('team/demos/show')
            ->where('matchId', $match->id)
            ->where('demo.id', $demo->id),
    );
});

test('a non-teammate is forbidden from viewing or fetching data for a demo', function () {
    $teamA = Team::factory()->create();
    $teamB = Team::factory()->create();
    $outsider = User::factory()->create(['team_id' => $teamB->id]);
    $player = User::factory()->create(['team_id' => $teamA->id]);
    FaceitMatch::factory()->create(['user_id' => $player->id, 'faceit_match_id' => 'match-1']);
    $demo = Demo::factory()->create(['faceit_match_id' => 'match-1']);

    $this->actingAs($outsider)->get("/team/demos/{$demo->id}")->assertForbidden();
    $this->actingAs($outsider)->get("/team/demos/{$demo->id}/data")->assertForbidden();
});

test('demo data 404s until parsing is ready', function () {
    $team = Team::factory()->create();
    $user = User::factory()->create(['team_id' => $team->id]);
    FaceitMatch::factory()->create(['user_id' => $user->id, 'faceit_match_id' => 'match-1']);
    $demo = Demo::factory()->processing()->create(['faceit_match_id' => 'match-1']);

    $this->actingAs($user)->get("/team/demos/{$demo->id}/data")->assertNotFound();
});

test('a teammate can fetch the parsed JSON once a demo is ready', function () {
    Storage::fake('local');
    $team = Team::factory()->create();
    $user = User::factory()->create(['team_id' => $team->id]);
    FaceitMatch::factory()->create(['user_id' => $user->id, 'faceit_match_id' => 'match-1']);
    Storage::disk('local')->put('demos/1/parsed.json', '{"map":"de_mirage","rounds":[]}');
    $demo = Demo::factory()->create(['faceit_match_id' => 'match-1', 'parsed_disk_path' => 'demos/1/parsed.json']);

    $response = $this->actingAs($user)->get("/team/demos/{$demo->id}/data");

    $response->assertOk();
});
