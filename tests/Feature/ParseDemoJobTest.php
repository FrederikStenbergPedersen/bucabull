<?php

use App\Jobs\ParseDemoJob;
use App\Models\Demo;
use Illuminate\Process\PendingProcess;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Process;
use Illuminate\Support\Facades\Storage;

/**
 * @return string the -out path the fake command was given
 */
function fakeParseOutputPath(PendingProcess $process): string
{
    $command = $process->command;
    $index = array_search('-out', $command, true);

    return $command[$index + 1];
}

function demoWithRawFile(): Demo
{
    $demo = Demo::factory()->processing()->create();
    $demo->update(['raw_disk_path' => "demos/{$demo->id}/raw.dem"]);
    Storage::disk('local')->put($demo->raw_disk_path, 'raw-bytes');

    return $demo;
}

test('a successful parse marks the demo ready and records a round/duration summary', function () {
    Storage::fake('local');
    Config::set('demos.retain_raw_demo', false);
    $demo = demoWithRawFile();

    Process::fake(function (PendingProcess $process) {
        // The output *file* content doesn't drive round_count/duration_seconds
        // (see ParseDemoJob's comment on why) — only its existence matters
        // here. The real summary comes from the process's stdout, matching
        // what go/cmd/democompact actually prints on success.
        file_put_contents(fakeParseOutputPath($process), json_encode([
            'map' => 'de_mirage',
            'tick_rate' => 64,
            'rounds' => [
                ['round_number' => 1, 'start_tick' => 0, 'end_tick' => 6400, 'winner' => 'CT', 'end_reason' => 'ct_win', 'frames' => [], 'kills' => [], 'grenades' => []],
                ['round_number' => 2, 'start_tick' => 6400, 'end_tick' => 12800, 'winner' => 'T', 'end_reason' => 't_win', 'frames' => [], 'kills' => [], 'grenades' => []],
            ],
        ]));

        return Process::result(output: json_encode(['round_count' => 2, 'duration_seconds' => 200]), exitCode: 0);
    });

    (new ParseDemoJob($demo))->handle();

    $demo->refresh();
    expect($demo->status)->toBe(Demo::STATUS_READY);
    expect($demo->round_count)->toBe(2);
    expect($demo->duration_seconds)->toBe(200); // 12800 ticks at 64/s = 200s
    expect($demo->error_message)->toBeNull();
    expect($demo->raw_disk_path)->toBeNull();
    Storage::disk('local')->assertMissing("demos/{$demo->id}/raw.dem");
    Storage::disk('local')->assertExists($demo->parsed_disk_path);
});

test('a failed parse marks the demo failed, records the error, and keeps the raw file', function () {
    Storage::fake('local');
    $demo = demoWithRawFile();

    Process::fake(fn () => Process::result(errorOutput: 'parse failed: invalid File-Type', exitCode: 1));

    (new ParseDemoJob($demo))->handle();

    $demo->refresh();
    expect($demo->status)->toBe(Demo::STATUS_FAILED);
    expect($demo->error_message)->toContain('invalid File-Type');
    expect($demo->parsed_disk_path)->toBeNull();
    Storage::disk('local')->assertExists($demo->raw_disk_path);
});

test('retain_raw_demo keeps the raw file after a successful parse', function () {
    Storage::fake('local');
    Config::set('demos.retain_raw_demo', true);
    $demo = demoWithRawFile();

    Process::fake(function (PendingProcess $process) {
        file_put_contents(fakeParseOutputPath($process), json_encode(['map' => 'de_mirage', 'tick_rate' => 64, 'rounds' => []]));

        return Process::result(output: json_encode(['round_count' => 0, 'duration_seconds' => 0]), exitCode: 0);
    });

    (new ParseDemoJob($demo))->handle();

    $demo->refresh();
    expect($demo->status)->toBe(Demo::STATUS_READY);
    expect($demo->round_count)->toBe(0);
    expect($demo->duration_seconds)->toBe(0);
    expect($demo->raw_disk_path)->not->toBeNull();
    Storage::disk('local')->assertExists($demo->raw_disk_path);
});

test('a demo with no raw file is marked failed without invoking the parser', function () {
    Storage::fake('local');
    $demo = Demo::factory()->processing()->create(['raw_disk_path' => null]);

    Process::fake();

    (new ParseDemoJob($demo))->handle();

    $demo->refresh();
    expect($demo->status)->toBe(Demo::STATUS_FAILED);
    expect($demo->error_message)->toBe('Demo has no raw file to parse.');
    Process::assertNothingRan();
});
