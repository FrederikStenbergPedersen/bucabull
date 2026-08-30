import { type TeamNavItem } from '@bucabull/ui';

export function useTeamNav(): TeamNavItem[] {
    return [
        // `home` is intentionally this tab's route name (roster is the
        // default view) — don't rename it when adding team.* routes later,
        // TeamController and tests reference it directly.
        { label: 'Roster', href: route('home'), active: route().current('home') },
        { label: 'Utility', href: route('team.grenades.index'), active: route().current('team.grenades.*') },
    ];
}
