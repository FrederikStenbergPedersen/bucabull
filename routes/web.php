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
    // it via Steam login yet) — the page itself renders a landing hero with
    // the Steam sign-in CTA in that case, rather than redirecting away.
    return Inertia::render('home', [
        'team' => $team?->load('users.playerStat'),
        'isOwnTeam' => $team ? $user?->team_id === $team->id : false,
    ]);
})->name('home');

Route::middleware('auth')->group(function () {
    Route::get('team/join', [TeamController::class, 'join'])->name('team.join');
    Route::post('team', [TeamController::class, 'store'])->name('team.store');
    Route::post('team/join', [TeamController::class, 'joinByCode'])->name('team.joinByCode');
});

require __DIR__.'/auth.php';
