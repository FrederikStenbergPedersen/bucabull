<?php

namespace Database\Factories;

use App\Models\PlayerStat;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<PlayerStat>
 */
class PlayerStatFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'steam_persona_state' => fake()->numberBetween(0, 6),
            'steam_last_seen_at' => now()->subHours(fake()->numberBetween(1, 48)),
            'playtime_2weeks_minutes' => fake()->numberBetween(0, 3000),
            'faceit_skill_level' => fake()->numberBetween(1, 10),
            'faceit_elo' => fake()->numberBetween(800, 3500),
            'faceit_region' => 'EU',
            'faceit_player_id' => fake()->uuid(),
            'faceit_lifetime_matches' => fake()->numberBetween(0, 2000),
            'faceit_lifetime_win_rate' => fake()->numberBetween(30, 70),
            'faceit_lifetime_avg_kd' => fake()->randomFloat(2, 0.7, 1.5),
            'presence_synced_at' => now(),
            'stats_synced_at' => now(),
        ];
    }
}
