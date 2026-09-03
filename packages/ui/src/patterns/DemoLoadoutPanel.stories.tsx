import type { Meta, StoryObj } from '@storybook/react-vite';

import { DemoLoadoutPanel, type DemoLoadoutPlayer } from './DemoLoadoutPanel';

const meta: Meta<typeof DemoLoadoutPanel> = {
    title: 'Patterns/DemoLoadoutPanel',
    component: DemoLoadoutPanel,
    parameters: {
        layout: 'padded',
    },
};
export default meta;

type Story = StoryObj<typeof DemoLoadoutPanel>;

const CT_PLAYERS: DemoLoadoutPlayer[] = [
    { steam_id: '1', name: 'Mag1c', money: 2150, weapons: [{ name: 'Glock-18', class: 'pistol', icon_key: 'glock' }] },
    { steam_id: '2', name: 'Afslappet', money: 1900, weapons: [{ name: 'MAG-7', class: 'heavy', icon_key: 'mag7' }] },
    {
        steam_id: '3',
        name: 'YUNG NOOB 1337',
        money: 8600,
        weapons: [
            { name: 'M4A4', class: 'rifle', icon_key: 'm4a4' },
            { name: 'Kevlar + Helmet', class: 'equipment', icon_key: '' },
        ],
    },
    { steam_id: '4', name: 'R1gth0us', money: 1850, weapons: [{ name: 'USP-S', class: 'pistol', icon_key: 'usp-s' }] },
    { steam_id: '5', name: 'Romby09', money: 2000, weapons: [{ name: 'Knife', class: 'equipment', icon_key: 'knife' }] },
];

export const Default: Story = {
    args: {
        team: 'CT',
        teamLabel: 'Counter-Terrorists',
        score: 4,
        players: CT_PLAYERS,
        live: {
            '1': { health: 100, is_alive: true },
            '2': { health: 100, is_alive: true },
            '3': { health: 100, is_alive: true },
            '4': { health: 100, is_alive: true },
            '5': { health: 100, is_alive: true },
        },
        className: 'max-w-[14rem]',
    },
};

/** A mid-round mix: some players hurt, one dead — confirms the dead-row dim treatment and the skull marker. */
export const MidRound: Story = {
    args: {
        team: 'T',
        teamLabel: 'Terrorists',
        score: 5,
        players: CT_PLAYERS,
        live: {
            '1': { health: 34, is_alive: true },
            '2': { health: 100, is_alive: true },
            '3': { health: 0, is_alive: false },
            '4': { health: 71, is_alive: true },
            '5': { health: 100, is_alive: true },
        },
        className: 'max-w-[14rem]',
    },
};

/** Before the first frame's live data has arrived — `live` is empty, every row should still render (full health, alive) rather than break. */
export const NoLiveDataYet: Story = {
    args: {
        team: 'CT',
        teamLabel: 'Counter-Terrorists',
        score: 0,
        players: CT_PLAYERS,
        live: {},
        className: 'max-w-[14rem]',
    },
};
