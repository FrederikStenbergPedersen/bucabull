<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PlayerStat extends Model
{
    protected $fillable = [
        'user_id',
        'steam_persona_state',
        'steam_last_seen_at',
        'playtime_2weeks_minutes',
        'faceit_skill_level',
        'faceit_elo',
        'faceit_region',
        'faceit_player_id',
        'faceit_lifetime_matches',
        'faceit_lifetime_win_rate',
        'faceit_lifetime_avg_kd',
        'fetched_at',
    ];

    protected function casts(): array
    {
        return [
            'steam_last_seen_at' => 'datetime',
            'faceit_lifetime_avg_kd' => 'float',
            'fetched_at' => 'datetime',
        ];
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
