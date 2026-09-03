<?php

// Demo upload/parse settings.

return [

    // Dedicated queue so a long-running parse never blocks the 5-minute
    // roster-refresh job on the default queue (see RefreshRosterStatsJob).
    'queue' => env('DEMOS_QUEUE', 'demos'),

    // `?:`, not env()'s own default param: .env.example ships this key
    // present-but-empty (DEMOS_PARSER_BINARY_PATH=) so local devs see it
    // exists — but env('X', 'default') only falls back when the var is
    // completely unset, not when it's set-to-empty, so a plain `cp
    // .env.example .env` would otherwise resolve this to '' instead of
    // the real production path and break the Docker image too.
    'parser_binary_path' => env('DEMOS_PARSER_BINARY_PATH') ?: '/usr/local/bin/democompact',

    // Keep the raw uploaded .dem on disk after a successful parse? Off by
    // default to control disk usage on the private volume — the tradeoff
    // is that re-parsing after a parser bugfix needs a re-upload while
    // this stays false. A failed parse always keeps its raw file
    // regardless of this setting, so a retry never needs one.
    'retain_raw_demo' => (bool) env('DEMOS_RETAIN_RAW', false),

    // ~1.2GB, in kilobytes (Laravel's `max` file rule unit) — CS2 demos
    // for a full match are typically several hundred MB.
    'max_upload_kb' => 1_258_291,

];
