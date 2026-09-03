<?php

namespace App\Support;

/**
 * Resolves an arbitrary map name (e.g. Faceit's raw "de_mirage") to its
 * curated radar calibration (config/map_radar.php), when one exists —
 * same normalization rule as MapOverview, kept as a separate class
 * because this is a genuinely different config (tactical radar +
 * calibration, not an atmospheric photo) with its own, likely much
 * slower, rollout (see that config file's placeholder-data comment).
 */
class MapRadar
{
    /**
     * @return array{slug: string, radar_image: string, pos_x: int, pos_y: int, scale: float, lower_radar_image: ?string}|null
     */
    public static function forSlug(string $mapName): ?array
    {
        $normalized = self::normalize($mapName);

        foreach (config('map_radar') as $map) {
            if ($normalized !== self::normalize($map['slug'])) {
                continue;
            }

            // No image yet (see the placeholder-data comment in
            // config/map_radar.php) — treat as "no radar coverage" so
            // the frontend only has one null check to make, not a
            // partially-populated calibration object to pick apart.
            return $map['radar_image'] ? $map : null;
        }

        return null;
    }

    private static function normalize(string $name): string
    {
        $name = preg_replace('/^(de|cs|dz)[_\s]+/i', '', trim($name));

        return preg_replace('/[^a-z0-9]/', '', strtolower($name));
    }
}
