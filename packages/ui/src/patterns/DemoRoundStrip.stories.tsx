import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';

import { DemoRoundStrip, type DemoRoundStripRound } from './DemoRoundStrip';

const meta: Meta<typeof DemoRoundStrip> = {
    title: 'Patterns/DemoRoundStrip',
    component: DemoRoundStrip,
};
export default meta;

type Story = StoryObj<typeof DemoRoundStrip>;

// A knife round plus 22 scored rounds, one team winning straight through
// the round-13 side swap — exercises the knife-round tab and the
// per-team (not per-side) score contract show.tsx's derivation follows:
// the winning team's score keeps climbing across the swap instead of
// resetting under the other side's column, plus the horizontal-scroll
// behavior a full match's round count needs.
const ROUNDS: DemoRoundStripRound[] = (() => {
    const knife: DemoRoundStripRound = { roundNumber: 0, winner: 'CT', isKnifeRound: true, ctScore: 0, tScore: 0 };

    let teamAScore = 0; // the team that starts the match on CT
    const teamBScore = 0; // never wins in this fixture, to keep the swap clear
    const scored = Array.from({ length: 22 }, (_, i) => {
        const roundNumber = i + 1;
        const aIsCT = roundNumber <= 12; // sides swap after round 12

        const winner: 'CT' | 'T' | '' = roundNumber === 8 ? '' : aIsCT ? 'CT' : 'T';
        if (winner) teamAScore++;

        return {
            roundNumber,
            winner,
            ctScore: aIsCT ? teamAScore : teamBScore,
            tScore: aIsCT ? teamBScore : teamAScore,
        };
    });

    return [knife, ...scored];
})();

export const Interactive: Story = {
    render: () => {
        const [activeIndex, setActiveIndex] = useState(8);
        return <DemoRoundStrip rounds={ROUNDS} activeIndex={activeIndex} onSelect={setActiveIndex} className="max-w-2xl" />;
    },
};
