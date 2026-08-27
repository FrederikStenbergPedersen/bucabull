<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class Team extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'slug',
        'invite_code',
        'owner_id',
    ];

    /**
     * @return HasMany<User, $this>
     */
    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    /**
     * The deployment's configured "home team" — shown on the public page
     * to logged-out visitors. Deployment-level config, not team data.
     */
    public static function home(): ?self
    {
        $slug = config('app.home_team_slug');

        return $slug ? static::where('slug', $slug)->first() : null;
    }

    public static function generateInviteCode(): string
    {
        do {
            $code = Str::upper(Str::random(10));
        } while (static::where('invite_code', $code)->exists());

        return $code;
    }
}
