<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Grenade extends Model
{
    use HasFactory;

    protected $fillable = [
        'team_id',
        'user_id',
        'map',
        'name',
        'setpos',
        'description',
        'video_link',
        'side',
        'throw_button',
        'stance',
        'movement',
        'jump',
        'type',
    ];

    /**
     * @return BelongsTo<Team, $this>
     */
    public function team(): BelongsTo
    {
        return $this->belongsTo(Team::class);
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * @return HasMany<GrenadeScreenshot, $this>
     */
    public function screenshots(): HasMany
    {
        return $this->hasMany(GrenadeScreenshot::class)->orderBy('position');
    }
}
