<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Demo extends Model
{
    use HasFactory;

    public const STATUS_PROCESSING = 'processing';

    public const STATUS_READY = 'ready';

    public const STATUS_FAILED = 'failed';

    public const STATUSES = [self::STATUS_PROCESSING, self::STATUS_READY, self::STATUS_FAILED];

    public const SOURCE_UPLOAD = 'upload';

    public const SOURCE_FACEIT_AUTO = 'faceit_auto';

    public const SOURCES = [self::SOURCE_UPLOAD, self::SOURCE_FACEIT_AUTO];

    protected $fillable = [
        'faceit_match_id',
        'map',
        'source',
        'status',
        'uploaded_by_user_id',
        'raw_disk_path',
        'parsed_disk_path',
        'round_count',
        'duration_seconds',
        'error_message',
        'parsed_at',
    ];

    protected function casts(): array
    {
        return [
            'parsed_at' => 'datetime',
        ];
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function uploadedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by_user_id');
    }

    /**
     * Every teammate's own per-player FaceitMatch row for this same real
     * match — see the migration comment on why this joins on the shared
     * faceit_match_id string rather than a foreign key.
     *
     * @return HasMany<FaceitMatch, $this>
     */
    public function faceitMatches(): HasMany
    {
        return $this->hasMany(FaceitMatch::class, 'faceit_match_id', 'faceit_match_id');
    }
}
