<?php

// Roster-refresh scaling knobs. The two jobs (RefreshPresenceJob,
// RefreshRosterStatsJob) are scheduled in routes/console.php.

return [

    // Only poll teams whose members have used the app within this many
    // days (see App\Http\Middleware\TouchTeamActivity). An abandoned team
    // costs zero outbound API calls.
    'active_team_days' => (int) env('ROSTER_ACTIVE_TEAM_DAYS', 14),

    // Max players whose expensive stats (playtime + FACEIT profile +
    // lifetime + match history) are refreshed per RefreshRosterStatsJob
    // run. This bounds the worst-case outbound request count per cycle no
    // matter how many teams exist — players are processed stalest-first,
    // so a backlog just means a player refreshes every
    // ceil(activePlayers / batch) cycles instead of every cycle.
    'stats_batch_size' => (int) env('ROSTER_STATS_BATCH_SIZE', 40),

    // A player's stats are treated as fresh for this long — the rolling
    // query skips anyone synced more recently even when the batch has room.
    'stats_ttl_minutes' => (int) env('ROSTER_STATS_TTL_MINUTES', 20),

    // Ceiling on outbound FACEIT requests within a single stats run. When
    // hit, the run stops cleanly and the not-yet-synced players are picked
    // up on the next cycle (their stats_synced_at was never advanced).
    'faceit_max_requests_per_run' => (int) env('ROSTER_FACEIT_MAX_REQUESTS_PER_RUN', 250),

];
