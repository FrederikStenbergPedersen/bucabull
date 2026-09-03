<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('player_stats', function (Blueprint $table) {
            // Faceit's internal player ID — needed to call the
            // player-scoped match-history endpoint. Only the CS2
            // sub-fields of the /players lookup are captured today; this
            // is the top-level player_id that response also carries.
            $table->string('faceit_player_id')->nullable()->after('faceit_region');
        });
    }

    public function down(): void
    {
        Schema::table('player_stats', function (Blueprint $table) {
            $table->dropColumn('faceit_player_id');
        });
    }
};
