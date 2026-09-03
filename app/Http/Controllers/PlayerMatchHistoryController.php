<?php

namespace App\Http\Controllers;

use App\Models\FaceitMatch;
use App\Models\User;
use App\Support\MapOverview;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PlayerMatchHistoryController extends Controller
{
    private const MATCH_LIMIT = 20;

    /**
     * Access is enforced by EnsureTeammate before this ever runs, so no
     * team check is needed here — see routes/web.php.
     */
    public function show(Request $request, User $player): Response
    {
        $matches = $player->faceitMatches()->with('demo')->orderByDesc('played_at')->limit(self::MATCH_LIMIT)->get()
            ->map(fn (FaceitMatch $match) => [
                ...$match->toArray(),
                // Faceit's raw map code ("de_mirage") resolved to a curated
                // photo for MatchCard, same as Grenades' custom-map guess.
                'map_overview' => MapOverview::guess($match->map),
                // toArray() already includes the eager-loaded `demo` relation
                // (or null) — spelled out here anyway since it's load-bearing
                // for the frontend, not an implementation detail to rely on
                // implicitly.
            ]);

        return Inertia::render('team/players/show', [
            'player' => $player->load('playerStat'),
            'matches' => $matches,
        ]);
    }
}
