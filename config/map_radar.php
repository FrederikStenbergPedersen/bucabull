<?php

// Tactical radar calibration for the 2D demo viewer — curated, keyed by
// the same slugs as config/maps.php. This is a DIFFERENT thing from
// that file's `overview` field: these images are top-down radars with
// per-map world-to-pixel calibration, not atmospheric screenshots (see
// config/maps.php's own comment on that distinction).
//
// Projection: pixel_x = (world_x - pos_x) / scale,
//             pixel_y = (pos_y - world_y) / scale
// (world Y is flipped — Source engine Y increases northward, image Y
// increases downward).
//
// Source: images (public/maps/radar/*.png, all 1024x1024) and
// calibration (pos_x/pos_y/scale) both pulled from
// https://github.com/MurkyYT/cs2-map-icons (data/available.json +
// images/radars/*_radar_psd.png as of 2026-09-02), which mirrors assets
// extracted from CS2's own game files. That repo does not itself grant a
// license over them — its README states the assets "are property of
// Valve Corporation" and it merely provides automated access — this is
// the same footing every third-party CS radar/analysis tool (HLTV,
// Leetify, awpy, ...) operates on. Confirmed acceptable for this
// project; re-confirm before reusing this source for anything beyond
// what's already here.
//
// `lower_radar_image` covers the three maps in this curated list that
// are genuinely two-level (per that repo's `verticalsections.lower`
// data): Nuke, Train, Vertigo. DemoRadar doesn't switch between
// upper/lower yet (it always draws `radar_image`) — that's a real gap
// for those three maps specifically, tracked separately, not solved by
// having the second image available here.
return [
    ['slug' => 'ancient', 'radar_image' => '/maps/radar/ancient.png', 'pos_x' => -2953, 'pos_y' => 2164, 'scale' => 5.0, 'lower_radar_image' => null],
    ['slug' => 'anubis', 'radar_image' => '/maps/radar/anubis.png', 'pos_x' => -2796, 'pos_y' => 3328, 'scale' => 5.22, 'lower_radar_image' => null],
    ['slug' => 'cache', 'radar_image' => '/maps/radar/cache.png', 'pos_x' => -2000, 'pos_y' => 3250, 'scale' => 5.5, 'lower_radar_image' => null],
    ['slug' => 'dust2', 'radar_image' => '/maps/radar/dust2.png', 'pos_x' => -2476, 'pos_y' => 3239, 'scale' => 4.4, 'lower_radar_image' => null],
    ['slug' => 'inferno', 'radar_image' => '/maps/radar/inferno.png', 'pos_x' => -2087, 'pos_y' => 3870, 'scale' => 4.9, 'lower_radar_image' => null],
    ['slug' => 'mirage', 'radar_image' => '/maps/radar/mirage.png', 'pos_x' => -3230, 'pos_y' => 1713, 'scale' => 5.0, 'lower_radar_image' => null],
    ['slug' => 'nuke', 'radar_image' => '/maps/radar/nuke.png', 'pos_x' => -3453, 'pos_y' => 2887, 'scale' => 7.0, 'lower_radar_image' => '/maps/radar/nuke-lower.png'],
    ['slug' => 'overpass', 'radar_image' => '/maps/radar/overpass.png', 'pos_x' => -4831, 'pos_y' => 1781, 'scale' => 5.2, 'lower_radar_image' => null],
    ['slug' => 'train', 'radar_image' => '/maps/radar/train.png', 'pos_x' => -2308, 'pos_y' => 2078, 'scale' => 4.082077, 'lower_radar_image' => '/maps/radar/train-lower.png'],
    ['slug' => 'vertigo', 'radar_image' => '/maps/radar/vertigo.png', 'pos_x' => -3168, 'pos_y' => 1762, 'scale' => 4.0, 'lower_radar_image' => '/maps/radar/vertigo-lower.png'],
];
