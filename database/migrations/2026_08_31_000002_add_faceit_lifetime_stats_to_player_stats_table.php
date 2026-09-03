<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('player_stats', function (Blueprint $table) {
            // FACEIT's own lifetime aggregate for the player (from
            // /players/{id}/games/cs2/stats), not a season slice — the
            // Data API has no "season" concept for regular matchmaking
            // (that query param only exists on league/hub endpoints), so
            // there's no boundary to compute a season figure from.
            $table->unsignedInteger('faceit_lifetime_matches')->nullable()->after('faceit_player_id');
            $table->unsignedTinyInteger('faceit_lifetime_win_rate')->nullable()->after('faceit_lifetime_matches');
            $table->decimal('faceit_lifetime_avg_kd', 5, 2)->nullable()->after('faceit_lifetime_win_rate');
        });
    }

    public function down(): void
    {
        Schema::table('player_stats', function (Blueprint $table) {
            $table->dropColumn(['faceit_lifetime_matches', 'faceit_lifetime_win_rate', 'faceit_lifetime_avg_kd']);
        });
    }
};
