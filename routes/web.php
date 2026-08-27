<?php

use App\Http\Controllers\TeamController;
use App\Models\Team;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    $user = Auth::user();

    if ($user && ! $user->team_id) {
        return to_route('team.join');
    }

    $team = $user?->team ?? Team::home();

    // No home team exists yet (e.g. brand new deployment, nobody's created
    // it via Steam login yet) — send guests to log in and create it, rather
    // than a bare 404. Once it exists, "/" goes back to showing it publicly.
    if (! $team) {
        return $user ? to_route('team.join') : to_route('login');
    }

    return Inertia::render('home', [
        'team' => $team->load('users.playerStat'),
        'isOwnTeam' => $user?->team_id === $team->id,
    ]);
})->name('home');

Route::middleware('auth')->group(function () {
    Route::get('team/join', [TeamController::class, 'join'])->name('team.join');
    Route::post('team', [TeamController::class, 'store'])->name('team.store');
    Route::post('team/join', [TeamController::class, 'joinByCode'])->name('team.joinByCode');
});

require __DIR__.'/auth.php';
