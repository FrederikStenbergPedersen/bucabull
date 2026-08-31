<?php

// Curated CS2 map pool for the Grenades library. Slugs are append-only —
// never rename or remove one once a grenade has been saved against it
// (grenades.map stores this slug as a plain string with no foreign key,
// so a rename silently reclassifies existing rows as "Other" with no
// error). `overview` is a public/ path to an in-map atmospheric screenshot
// (not a tactical radar overview) shown as the sidebar item's background;
// leave it null until one is supplied — the map still works, it just
// renders without a picture. Files live in public/maps/{slug}.webp.

return [
    ['slug' => 'ancient', 'name' => 'Ancient', 'overview' => '/maps/ancient.webp'],
    ['slug' => 'anubis', 'name' => 'Anubis', 'overview' => '/maps/anubis.webp'],
    ['slug' => 'cache', 'name' => 'Cache', 'overview' => '/maps/cache.webp'],
    ['slug' => 'dust2', 'name' => 'Dust II', 'overview' => '/maps/dust2.webp'],
    ['slug' => 'inferno', 'name' => 'Inferno', 'overview' => '/maps/inferno.webp'],
    ['slug' => 'mirage', 'name' => 'Mirage', 'overview' => '/maps/mirage.webp'],
    ['slug' => 'nuke', 'name' => 'Nuke', 'overview' => '/maps/nuke.webp'],
    ['slug' => 'overpass', 'name' => 'Overpass', 'overview' => '/maps/overpass.webp'],
    ['slug' => 'train', 'name' => 'Train', 'overview' => '/maps/train.webp'],
    ['slug' => 'vertigo', 'name' => 'Vertigo', 'overview' => '/maps/vertigo.webp'],
];
