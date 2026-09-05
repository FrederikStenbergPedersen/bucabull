<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('teams', function (Blueprint $table) {
            // Last time any member used the app (touched by
            // TouchTeamActivity, at most once/hour/team). The roster
            // refresh jobs only poll teams active within
            // config('roster.active_team_days') so a signed-up-then-
            // abandoned team costs nothing in outbound API calls.
            $table->timestamp('last_active_at')->nullable()->index()->after('owner_id');
        });

        // Existing teams predate the column — treat them as active now so
        // their first refresh cycle after deploy still runs.
        DB::table('teams')->update(['last_active_at' => now()]);
    }

    public function down(): void
    {
        Schema::table('teams', function (Blueprint $table) {
            $table->dropColumn('last_active_at');
        });
    }
};
