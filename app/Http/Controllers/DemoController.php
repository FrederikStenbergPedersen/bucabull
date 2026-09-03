<?php

namespace App\Http\Controllers;

use App\Jobs\ParseDemoJob;
use App\Models\Demo;
use App\Models\FaceitMatch;
use App\Models\User;
use App\Rules\ValidDemoFile;
use App\Support\MapRadar;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class DemoController extends Controller
{
    /**
     * {match} is a FaceitMatch, not a Demo — a demo doesn't exist yet the
     * first time someone uploads one, and this is the only unambiguous,
     * no-auto-detection-needed way to say "this file is for that match":
     * the uploader picked it from that match's own card.
     */
    public function store(Request $request, FaceitMatch $match): RedirectResponse
    {
        abort_unless($match->user->team_id === $request->user()->team_id, 403);

        $existing = Demo::where('faceit_match_id', $match->faceit_match_id)
            ->where('status', '!=', Demo::STATUS_FAILED)
            ->first();

        if ($existing) {
            return to_route('team.demos.show', $existing);
        }

        Validator::make($request->all(), [
            'demo' => ['required', 'file', 'max:'.config('demos.max_upload_kb'), new ValidDemoFile],
        ])->validate();

        // updateOrCreate (not create): a previously failed demo for this
        // match reuses the same row on retry rather than accumulating one
        // row per attempt.
        $demo = Demo::updateOrCreate(
            ['faceit_match_id' => $match->faceit_match_id],
            [
                'map' => $match->map,
                'source' => Demo::SOURCE_UPLOAD,
                'status' => Demo::STATUS_PROCESSING,
                'uploaded_by_user_id' => $request->user()->id,
                'error_message' => null,
                'parsed_disk_path' => null,
            ],
        );

        $path = $request->file('demo')->store("demos/{$demo->id}", 'local');
        $demo->update(['raw_disk_path' => $path]);

        ParseDemoJob::dispatch($demo)->onQueue(config('demos.queue'));

        return to_route('team.demos.show', $demo);
    }

    public function show(Request $request, Demo $demo): Response
    {
        $match = $this->matchFor($demo, $request->user());

        abort_unless($match !== null, 403);

        return Inertia::render('team/demos/show', [
            'demo' => $demo->only(['id', 'map', 'status', 'round_count', 'duration_seconds', 'error_message']),
            'mapRadar' => MapRadar::forSlug($demo->map),
            // Lets the viewer page offer a retry (re-upload) when status
            // is failed, without needing a separate lookup — store()
            // takes a FaceitMatch id, not a Demo id, and a Demo doesn't
            // otherwise know which match(es) it belongs to.
            'matchId' => $match->id,
        ]);
    }

    public function data(Request $request, Demo $demo): StreamedResponse
    {
        abort_unless($this->matchFor($demo, $request->user()) !== null, 403);
        abort_unless($demo->status === Demo::STATUS_READY && $demo->parsed_disk_path, 404);

        return Storage::disk('local')->response($demo->parsed_disk_path);
    }

    /**
     * A demo belongs to a real match, not a single player — this finds
     * *a* FaceitMatch row (any teammate's, not necessarily the viewer's
     * own) proving the viewer's team actually played it, same shape as
     * EnsureTeammate/GrenadeController's inline checks, no policy
     * classes (none exist anywhere in this app). Returns the match
     * itself (not just a bool) since show() also needs its id.
     */
    private function matchFor(Demo $demo, ?User $viewer): ?FaceitMatch
    {
        if ($viewer === null) {
            return null;
        }

        return FaceitMatch::where('faceit_match_id', $demo->faceit_match_id)
            ->whereHas('user', fn ($query) => $query->where('team_id', $viewer->team_id))
            ->first();
    }
}
