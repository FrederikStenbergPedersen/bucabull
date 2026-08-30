<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

class GrenadeScreenshot extends Model
{
    use HasFactory;

    protected $fillable = [
        'grenade_id',
        'path',
        'position',
    ];

    protected $appends = ['url'];

    protected function url(): Attribute
    {
        return Attribute::make(get: fn () => Storage::disk('public')->url($this->path));
    }

    /**
     * @return BelongsTo<Grenade, $this>
     */
    public function grenade(): BelongsTo
    {
        return $this->belongsTo(Grenade::class);
    }
}
