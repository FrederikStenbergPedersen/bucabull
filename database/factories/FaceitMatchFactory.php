<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<\App\Models\FaceitMatch>
 */
class FaceitMatchFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $kills = fake()->numberBetween(10, 30);
        $deaths = fake()->numberBetween(5, 25);

        return [
            'user_id' => User::factory(),
            'faceit_match_id' => '1-'.fake()->unique()->uuid(),
            'map' => 'de_mirage',
            'result' => fake()->boolean(),
            'score' => '13 / 9',
            'kills' => $kills,
            'deaths' => $deaths,
            'assists' => fake()->numberBetween(0, 10),
            'kd_ratio' => round($kills / max($deaths, 1), 2),
            'played_at' => fake()->dateTimeBetween('-30 days'),
            'fetched_at' => now(),
        ];
    }
}
