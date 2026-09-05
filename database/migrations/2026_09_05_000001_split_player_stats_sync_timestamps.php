<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Roster data is refreshed in two tiers with very different cadences —
     * Steam presence every few minutes (cheap, batched) and the expensive
     * per-player FACEIT/playtime calls on a slower rolling schedule. Each
     * tier needs its own "last synced" marker so the rolling query can
     * pick the stalest players without one tier's write resetting the
     * other's clock. Replaces the single `fetched_at`.
     */
    public function up(): void
    {
        Schema::table('player_stats', function (Blueprint $table) {
            $table->timestamp('presence_synced_at')->nullable()->after('fetched_at');
            $table->timestamp('stats_synced_at')->nullable()->index()->after('presence_synced_at');
        });

        DB::table('player_stats')->update([
            'presence_synced_at' => DB::raw('fetched_at'),
            'stats_synced_at' => DB::raw('fetched_at'),
        ]);

        Schema::table('player_stats', function (Blueprint $table) {
            $table->dropColumn('fetched_at');
        });
    }

    public function down(): void
    {
        Schema::table('player_stats', function (Blueprint $table) {
            $table->timestamp('fetched_at')->nullable()->after('faceit_lifetime_avg_kd');
        });

        DB::table('player_stats')->update(['fetched_at' => DB::raw('stats_synced_at')]);

        Schema::table('player_stats', function (Blueprint $table) {
            $table->dropColumn(['presence_synced_at', 'stats_synced_at']);
        });
    }
};
