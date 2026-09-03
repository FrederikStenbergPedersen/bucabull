import { Pause, Play, SkipBack, SkipForward } from 'lucide-react';

import { Button } from '../primitives/Button';
import { RangeSlider } from '../primitives/RangeSlider';
import { SegmentedControl } from '../primitives/SegmentedControl';
import { Text } from '../primitives/Text';

export interface DemoTransportControlsProps {
    isPlaying: boolean;
    onTogglePlay: () => void;
    timeS: number;
    durationS: number;
    onSeek: (timeS: number) => void;
    speed: number;
    speedOptions: number[];
    onSpeedChange: (speed: number) => void;
    onPrevRound: () => void;
    onNextRound: () => void;
    canGoPrevRound: boolean;
    canGoNextRound: boolean;
}

function formatTime(seconds: number): string {
    const clamped = Math.max(0, Math.floor(seconds));
    const m = Math.floor(clamped / 60);
    const s = clamped % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
}

/** Play/pause, round-skip, scrub bar and speed control — the whole bottom transport bar for the demo viewer, one component so the page doesn't have to lay these out itself. */
export function DemoTransportControls({
    isPlaying,
    onTogglePlay,
    timeS,
    durationS,
    onSeek,
    speed,
    speedOptions,
    onSpeedChange,
    onPrevRound,
    onNextRound,
    canGoPrevRound,
    canGoNextRound,
}: DemoTransportControlsProps) {
    return (
        <div className="border-border bg-card flex flex-col gap-3 rounded-md border p-4">
            <div className="flex items-center gap-3">
                <Text variant="muted" className="w-10 shrink-0 font-mono tabular-nums">
                    {formatTime(timeS)}
                </Text>
                <RangeSlider min={0} max={Math.max(durationS, 0.01)} step={0.1} value={timeS} onChange={onSeek} />
                <Text variant="muted" className="w-10 shrink-0 font-mono tabular-nums">
                    {formatTime(durationS)}
                </Text>
            </div>

            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-1.5">
                    <Button variant="ghost" size="icon" onClick={onPrevRound} disabled={!canGoPrevRound} aria-label="Previous round">
                        <SkipBack className="size-4" />
                    </Button>
                    <Button variant="primary" size="icon" onClick={onTogglePlay} aria-label={isPlaying ? 'Pause' : 'Play'}>
                        {isPlaying ? <Pause className="size-4" /> : <Play className="size-4" />}
                    </Button>
                    <Button variant="ghost" size="icon" onClick={onNextRound} disabled={!canGoNextRound} aria-label="Next round">
                        <SkipForward className="size-4" />
                    </Button>
                </div>

                <SegmentedControl
                    size="sm"
                    value={String(speed)}
                    onChange={(value) => onSpeedChange(Number(value))}
                    options={speedOptions.map((option) => ({ value: String(option), label: `${option}x` }))}
                />
            </div>
        </div>
    );
}
