<?php

use App\Jobs\RefreshPresenceJob;
use App\Jobs\RefreshRosterStatsJob;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Steam online status: cheap and batched, so it runs often. The
// expiry on withoutOverlapping is deliberate — a run that dies without
// releasing its lock must not wedge the schedule forever.
Schedule::job(new RefreshPresenceJob)
    ->everyFiveMinutes()
    ->withoutOverlapping(10);

// Playtime + every FACEIT call: rolling, batched, budget-capped (see the
// job). Slower cadence because none of this data is time-sensitive the
// way presence is.
Schedule::job(new RefreshRosterStatsJob)
    ->everyTenMinutes()
    ->withoutOverlapping(30);
