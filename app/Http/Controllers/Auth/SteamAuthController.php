<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
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

        RefreshRosterStatsJob::dispatch();

        return $user->team_id
            ? redirect()->intended(route('home', absolute: false))
            : to_route('team.join');
    }
}
