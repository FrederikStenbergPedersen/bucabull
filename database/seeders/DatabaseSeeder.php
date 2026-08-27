<?php

namespace Database\Seeders;

use App\Models\Team;
use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $owner = User::factory()->create(['nickname' => 'BucabullOwner']);

        $team = Team::factory()->create([
            'name' => 'Bucabull eSports',
            'slug' => 'bucabull',
            'owner_id' => $owner->id,
        ]);

        $owner->update(['team_id' => $team->id, 'role' => 'owner']);

        User::factory(4)->create(['team_id' => $team->id]);
    }
}
