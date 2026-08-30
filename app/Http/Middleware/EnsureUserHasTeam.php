<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserHasTeam
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! $request->user()->team_id) {
            return to_route('team.join');
        }

        return $next($request);
    }
}
