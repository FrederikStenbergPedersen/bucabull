<?php

namespace App\Http\Middleware;

use App\Models\Team;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Symfony\Component\HttpFoundation\Response;

/**
 * Records that a team is in active use so the roster-refresh jobs
 * (RefreshPresenceJob, RefreshRosterStatsJob) can skip teams nobody
 * touches. Throttled to one write per team per hour via the cache — a
 * team scrolling the app doesn't hammer an UPDATE on every request.
 */
class TouchTeamActivity
{
    public function handle(Request $request, Closure $next): Response
    {
        $teamId = $request->user()?->team_id;

        if ($teamId && Cache::add("team-activity:{$teamId}", true, now()->addHour())) {
            Team::whereKey($teamId)->update(['last_active_at' => now()]);
        }

        return $next($request);
    }
}
