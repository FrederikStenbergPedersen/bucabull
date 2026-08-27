<?php

namespace App\Http\Controllers;

use App\Models\Team;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class TeamController extends Controller
{
    /**
     * Show the create-or-join page. Only reachable when the user has no team.
     */
    public function join(): Response|RedirectResponse
    {
        if (Auth::user()->team_id) {
            return to_route('home');
        }

        return Inertia::render('team/join');
    }

    /**
     * Create a new team, with the current user as its owner.
     */
    public function store(Request $request): RedirectResponse
    {
        if (Auth::user()->team_id) {
            return to_route('home');
        }

        $data = Validator::make($request->all(), [
            'name' => ['required', 'string', 'min:2', 'max:40'],
        ])->validate();

        $user = Auth::user();
        $slug = $this->uniqueSlug($data['name']);

        $team = Team::create([
            'name' => $data['name'],
            'slug' => $slug,
            'invite_code' => Team::generateInviteCode(),
            'owner_id' => $user->id,
        ]);

        $user->update(['team_id' => $team->id, 'role' => 'owner']);

        return to_route('home');
    }

    /**
     * Join an existing team via its invite code.
     */
    public function joinByCode(Request $request): RedirectResponse
    {
        if (Auth::user()->team_id) {
            return to_route('home');
        }

        $data = Validator::make($request->all(), [
            'invite_code' => ['required', 'string'],
        ])->validate();

        $team = Team::where('invite_code', Str::upper($data['invite_code']))->first();

        if (! $team) {
            throw ValidationException::withMessages(['invite_code' => 'That invite code doesn\'t match any team.']);
        }

        Auth::user()->update(['team_id' => $team->id, 'role' => 'member']);

        return to_route('home');
    }

    private function uniqueSlug(string $name): string
    {
        $base = Str::slug($name);
        $slug = $base;
        $suffix = 1;

        while (Team::where('slug', $slug)->exists()) {
            $slug = "{$base}-".++$suffix;
        }

        return $slug;
    }
}
