<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('strategies', function (Blueprint $table) {
            $table->id();
            $table->foreignId('team_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('map', 60);
            $table->string('name');
            $table->json('types');
            $table->string('side');
            $table->text('note')->nullable();
            $table->string('video_link')->nullable();
            $table->text('description')->nullable();
            $table->timestamps();

            $table->index(['team_id', 'map']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('strategies');
    }
};
