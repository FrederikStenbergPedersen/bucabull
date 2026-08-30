<?php

namespace Database\Factories;

use App\Models\Grenade;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<\App\Models\GrenadeScreenshot>
 */
class GrenadeScreenshotFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'grenade_id' => Grenade::factory(),
            'path' => 'grenade-screenshots/'.fake()->uuid().'.jpg',
            'position' => 0,
        ];
    }
}
