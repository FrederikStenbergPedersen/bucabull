<?php

namespace Database\Factories;

use App\Models\Strategy;
use App\Models\Team;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Strategy>
 */
class StrategyFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'team_id' => Team::factory(),
            'user_id' => User::factory(),
            'map' => 'mirage',
            'name' => fake()->words(3, true),
            'types' => fake()->randomElements(['buyround', 'force', 'pistol'], fake()->numberBetween(1, 2)),
            'side' => fake()->randomElement(['CT', 'T']),
            'note' => fake()->sentence(),
            'video_link' => null,
            'description' => fake()->paragraph(),
        ];
    }
}
