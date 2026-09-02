<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FaceitMatch extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'faceit_match_id',
        'map',
        'result',
        'score',
        'kills',
        'deaths',
        'assists',
        'kd_ratio',
        'played_at',
        'fetched_at',
    ];

    protected function casts(): array
    {
        return [
            'result' => 'boolean',
            'kd_ratio' => 'float',
            'played_at' => 'datetime',
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

    /**
     * The one Demo shared by every teammate's own row for this same real
     * match (see the demos migration for why this joins on the plain
     * faceit_match_id string rather than a foreign key) — this is what
     * lets a second teammate's match card resolve straight to the first
     * teammate's upload instead of prompting again.
     *
     * @return BelongsTo<Demo, $this>
     */
    public function demo(): BelongsTo
    {
        return $this->belongsTo(Demo::class, 'faceit_match_id', 'faceit_match_id');
    }
}
