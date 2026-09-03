<?php

namespace Database\Factories;

use App\Models\Demo;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Demo>
 */
class DemoFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'faceit_match_id' => '1-'.fake()->unique()->uuid(),
            'map' => 'de_mirage',
            'source' => Demo::SOURCE_UPLOAD,
            'status' => Demo::STATUS_READY,
            'uploaded_by_user_id' => User::factory(),
            'raw_disk_path' => null,
            'parsed_disk_path' => 'demos/1/parsed.json',
            'round_count' => 24,
            'duration_seconds' => 2400,
            'error_message' => null,
            'parsed_at' => now(),
        ];
    }

    public function processing(): self
    {
        return $this->state([
            'status' => Demo::STATUS_PROCESSING,
            'parsed_disk_path' => null,
            'round_count' => null,
            'duration_seconds' => null,
            'parsed_at' => null,
        ]);
    }

    public function failed(): self
    {
        return $this->state([
            'status' => Demo::STATUS_FAILED,
            'parsed_disk_path' => null,
            'round_count' => null,
            'duration_seconds' => null,
            'parsed_at' => null,
            'error_message' => 'Parse failed.',
        ]);
    }
}
