<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('player_stats', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
            $table->unsignedTinyInteger('steam_persona_state')->nullable();
            $table->timestamp('steam_last_seen_at')->nullable();
            $table->unsignedInteger('playtime_2weeks_minutes')->nullable();
            $table->unsignedTinyInteger('faceit_skill_level')->nullable();
            $table->unsignedInteger('faceit_elo')->nullable();
            $table->string('faceit_region')->nullable();
            $table->timestamp('fetched_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('player_stats');
    }
};
