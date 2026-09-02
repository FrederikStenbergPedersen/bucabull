<?php

use App\Support\MapRadar;

// Uses a fake config rather than the real config/map_radar.php — every
// real entry currently has radar_image = null (see that file's
// placeholder-data comment), which would make these tests trivially
// return null regardless of whether the matching logic itself works.
function fakeMapRadarConfig(): void
{
    config(['map_radar' => [
        ['slug' => 'mirage', 'radar_image' => '/maps/radar/mirage.webp', 'pos_x' => -3230, 'pos_y' => 1713, 'scale' => 5.0, 'lower_radar_image' => null],
        ['slug' => 'nuke', 'radar_image' => null, 'pos_x' => 0, 'pos_y' => 0, 'scale' => 1.0, 'lower_radar_image' => null],
    ]]);
}

test('an exact slug match with a real image returns its calibration', function () {
    fakeMapRadarConfig();

    expect(MapRadar::forSlug('mirage'))->toBe([
        'slug' => 'mirage', 'radar_image' => '/maps/radar/mirage.webp', 'pos_x' => -3230, 'pos_y' => 1713, 'scale' => 5.0, 'lower_radar_image' => null,
    ]);
});

test('Faceit\'s raw map code normalizes to the same curated slug', function () {
    fakeMapRadarConfig();

    expect(MapRadar::forSlug('de_mirage'))->not->toBeNull();
});

test('a map with no image yet returns null even though it has a config entry', function () {
    fakeMapRadarConfig();

    expect(MapRadar::forSlug('nuke'))->toBeNull();
});

test('an unrecognized map returns null', function () {
    fakeMapRadarConfig();

    expect(MapRadar::forSlug('some_workshop_map'))->toBeNull();
});
