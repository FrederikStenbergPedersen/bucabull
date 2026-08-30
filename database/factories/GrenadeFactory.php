<?php

namespace Database\Factories;

use App\Models\Team;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<\App\Models\Grenade>
 */
class GrenadeFactory extends Factory
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
            'setpos' => 'setpos '.fake()->numerify('####').' '.fake()->numerify('####').' '.fake()->numerify('###'),
            'description' => fake()->sentence(),
            'video_link' => null,
            'side' => fake()->randomElement(['CT', 'T']),
            'throw_button' => fake()->randomElement(['left', 'right', 'both']),
            'stance' => fake()->randomElement(['standing', 'crouching']),
            'movement' => fake()->randomElement(['standing', 'walking', 'running']),
            'jump' => fake()->randomElement(['standing', 'jumping']),
            'type' => fake()->randomElement(['smoke', 'flash', 'grenade', 'molotov']),
        ];
    }
}
