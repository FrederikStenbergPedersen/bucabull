<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('faceit_matches', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('faceit_match_id');
            $table->string('map');
            $table->boolean('result');
            $table->string('score')->nullable();
            $table->unsignedSmallInteger('kills')->nullable();
            $table->unsignedSmallInteger('deaths')->nullable();
            $table->unsignedSmallInteger('assists')->nullable();
            $table->decimal('kd_ratio', 5, 2)->nullable();
            $table->timestamp('played_at')->nullable();
            $table->timestamp('fetched_at')->nullable();
            $table->timestamps();

            // Re-fetching the same window of history should upsert, not
            // duplicate — this is what makes updateOrCreate keyed on these
            // two columns safe to call on every scheduled refresh.
            $table->unique(['user_id', 'faceit_match_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('faceit_matches');
    }
};
