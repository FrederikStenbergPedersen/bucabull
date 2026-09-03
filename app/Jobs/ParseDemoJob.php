<?php

namespace App\Jobs;

use App\Models\Demo;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Process;
use Illuminate\Support\Facades\Storage;

/**
 * Shells out to the `democompact` Go CLI (go/cmd/democompact — see its
 * README for the exact CLI contract) to turn an uploaded .dem into the
 * compact per-round JSON the 2D demo viewer replays. One parse serves
 * every teammate who later watches the match, via the shared Demo row.
 */
class ParseDemoJob implements ShouldQueue
{
    use Queueable;

    // A little under the queue worker's own --timeout for this job (see
    // docker-compose.prod.yml's queue-demos service) so a stuck parse
    // gets a clean "process timed out" failure written to the Demo row
    // before the outer worker forcibly kills the whole job.
    private const PARSE_TIMEOUT_SECONDS = 1740;

    public int $timeout = 1800;

    // A failed parse needs investigation (a corrupt upload, a demo
    // version demoinfocs-golang doesn't support yet), not a blind retry
    // — DemoController@store's retry path re-uses this same Demo row on
    // a fresh upload instead.
    public int $tries = 1;

    public function __construct(public readonly Demo $demo) {}

    public function handle(): void
    {
        if (! $this->demo->raw_disk_path) {
            $this->markFailed('Demo has no raw file to parse.');

            return;
        }

        $disk = Storage::disk('local');
        $rawPath = $disk->path($this->demo->raw_disk_path);
        $outputRelativePath = "demos/{$this->demo->id}/parsed.json";
        $outputPath = $disk->path($outputRelativePath);

        $result = Process::timeout(self::PARSE_TIMEOUT_SECONDS)->run([
            config('demos.parser_binary_path'),
            '-in', $rawPath,
            '-out', $outputPath,
        ]);

        if (! $result->successful()) {
            $message = $result->errorOutput() ?: $result->output() ?: 'democompact exited with status '.$result->exitCode();
            $this->markFailed($message);

            return;
        }

        // democompact prints a small {round_count, duration_seconds}
        // summary to stdout on success — read that instead of re-opening
        // and json_decode-ing the (potentially tens-of-MB) output file
        // ourselves, which for a real full match is exactly the kind of
        // avoidable memory spike this whole subprocess exists to keep
        // out of the PHP process (confirmed the hard way: doing that
        // here originally exhausted a 128M memory_limit on a real demo).
        $summary = json_decode($result->output(), true) ?? [];

        $this->demo->update([
            'status' => Demo::STATUS_READY,
            'parsed_disk_path' => $outputRelativePath,
            'round_count' => $summary['round_count'] ?? 0,
            'duration_seconds' => $summary['duration_seconds'] ?? 0,
            'error_message' => null,
            'parsed_at' => now(),
        ]);

        if (! config('demos.retain_raw_demo')) {
            $disk->delete($this->demo->raw_disk_path);
            $this->demo->update(['raw_disk_path' => null]);
        }
    }

    /**
     * A failed parse keeps its raw file regardless of
     * config('demos.retain_raw_demo') — unlike the success path, a retry
     * here means re-running democompact against the same upload, not
     * asking the uploader to attach the file again.
     */
    private function markFailed(string $message): void
    {
        Log::warning('Demo parse failed', ['demo_id' => $this->demo->id, 'error' => $message]);

        $this->demo->update([
            'status' => Demo::STATUS_FAILED,
            'error_message' => mb_substr($message, 0, 2000),
        ]);
    }
}
