<?php

use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\Auth\SteamAuthController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::middleware('guest')->group(function () {
    Route::get('login', fn () => Inertia::render('auth/login'))
        ->name('login');

    Route::get('auth/steam/redirect', [SteamAuthController::class, 'redirect'])
        ->name('steam.redirect');

    Route::get('auth/steam/callback', [SteamAuthController::class, 'callback'])
        ->name('steam.callback');
});

Route::middleware('auth')->group(function () {
    Route::post('logout', [AuthenticatedSessionController::class, 'destroy'])
        ->name('logout');
});
