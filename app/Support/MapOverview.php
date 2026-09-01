<?php

namespace App\Support;

/**
 * Resolves an arbitrary map name to its curated overview photo
 * (config/maps.php) when there's a plausible match — e.g. Faceit's raw
 * map code ("de_mirage") or a Grenades free-text name typed instead of
 * picked from the dropdown ("de_dust2", "Dust 2"). Exact match only
 * (after stripping a de_/cs_/dz_ prefix and non-alphanumerics), not
 * substring matching, to avoid false positives on short slugs.
 *
 * Shared by GrenadeController (custom map names) and
 * PlayerMatchHistoryController (Faceit's raw map codes) so the two never
 * drift into slightly different normalization rules.
 */
class MapOverview
{
    public static function guess(string $mapName): ?string
    {
        $normalized = self::normalize($mapName);

        foreach (config('maps') as $map) {
            if ($normalized === self::normalize($map['slug']) || $normalized === self::normalize($map['name'])) {
                return $map['overview'];
            }
        }

        return null;
    }

    private static function normalize(string $name): string
    {
        $name = preg_replace('/^(de|cs|dz)[_\s]+/i', '', trim($name));

        return preg_replace('/[^a-z0-9]/', '', strtolower($name));
    }
}
