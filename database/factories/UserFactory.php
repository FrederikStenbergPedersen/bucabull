<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<User>
 */
class UserFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'steam_id' => (string) fake()->unique()->numberBetween(76561197960265728, 76561199999999999),
            'nickname' => fake()->userName(),
            'avatar' => null,
            'team_id' => null,
            'role' => 'member',
        ];
    }
}
