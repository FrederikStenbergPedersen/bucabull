<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Jobs\RefreshPresenceJob;
use App\Jobs\RefreshRosterStatsJob;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Laravel\Socialite\Facades\Socialite;

class SteamAuthController extends Controller
{
    /**
     * Redirect the user to Steam's OpenID login.
     */
    public function redirect(): RedirectResponse
    {
        return Socialite::driver('steam')->redirect();
    }

    /**
     * Handle the callback from Steam and log the user in.
     */
    public function callback(): RedirectResponse
    {
        $steamUser = Socialite::driver('steam')->user();

        $user = User::updateOrCreate(
            ['steam_id' => $steamUser->getId()],
            [
                'nickname' => $steamUser->getNickname(),
                'avatar' => $steamUser->getAvatar(),
            ],
        );

        Auth::login($user, remember: true);

        // Mark the team active so the scheduled roster jobs keep polling
        // it, and refresh this player's own stats now rather than waiting
        // for the next rolling cycle.
        if ($user->team_id) {
            $user->team()->update(['last_active_at' => now()]);
        }

        RefreshPresenceJob::dispatch($user);
        RefreshRosterStatsJob::dispatch($user);

        return $user->team_id
            ? redirect()->intended(route('home', absolute: false))
            : to_route('team.join');
    }
}
