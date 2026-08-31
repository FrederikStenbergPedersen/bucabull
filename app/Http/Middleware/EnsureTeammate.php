<?php

namespace App\Http\Middleware;

use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Guards a {player} route parameter so only a member of that player's own
 * team can view their page. Every other team-scoped query in the app is
 * naturally restricted because it's built from the caller's own team_id
 * (see GrenadeController), and the one place that checks a specific
 * resource (abort_unless($grenade->team_id === ...)) is comparing a
 * resource's team, not another user's — this is the first "is user A a
 * teammate of user B" check in the app.
 */
class EnsureTeammate
{
    public function handle(Request $request, Closure $next): Response
    {
        $player = $request->route('player');

        abort_unless(
            $player instanceof User && $player->team_id !== null && $player->team_id === $request->user()->team_id,
            403,
        );

        return $next($request);
    }
}
