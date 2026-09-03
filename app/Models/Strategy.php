<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Strategy extends Model
{
    use HasFactory;

    protected $fillable = [
        'team_id',
        'user_id',
        'map',
        'name',
        'types',
        'side',
        'note',
        'video_link',
        'description',
    ];

    protected $casts = [
        'types' => 'array',
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
}
