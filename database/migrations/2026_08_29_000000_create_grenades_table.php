<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('grenades', function (Blueprint $table) {
            $table->id();
            $table->foreignId('team_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('map', 60);
            $table->string('name');
            $table->text('setpos')->nullable();
            $table->text('description')->nullable();
            $table->string('video_link')->nullable();
            $table->string('side');
            $table->string('throw_button');
            $table->string('stance');
            $table->string('movement');
            $table->string('jump');
            $table->string('type');
            $table->timestamps();

            $table->index(['team_id', 'map']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('grenades');
    }
};
