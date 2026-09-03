<?php

use App\Http\Controllers\GrenadeController;
use App\Http\Controllers\StrategyController;
use App\Http\Controllers\TeamController;
use App\Http\Middleware\EnsureUserHasTeam;
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

Route::middleware(['auth', EnsureUserHasTeam::class])->prefix('team')->name('team.')->group(function () {
    Route::get('grenades', [GrenadeController::class, 'index'])->name('grenades.index');
    Route::post('grenades', [GrenadeController::class, 'store'])->name('grenades.store');
    Route::put('grenades/{grenade}', [GrenadeController::class, 'update'])->name('grenades.update');
    Route::delete('grenades/{grenade}', [GrenadeController::class, 'destroy'])->name('grenades.destroy');
    Route::delete('grenades/{grenade}/screenshots/{screenshot}', [GrenadeController::class, 'destroyScreenshot'])->name('grenades.screenshots.destroy');

    Route::get('strategies', [StrategyController::class, 'index'])->name('strategies.index');
    Route::post('strategies', [StrategyController::class, 'store'])->name('strategies.store');
    Route::put('strategies/{strategy}', [StrategyController::class, 'update'])->name('strategies.update');
    Route::delete('strategies/{strategy}', [StrategyController::class, 'destroy'])->name('strategies.destroy');
});

require __DIR__.'/auth.php';
