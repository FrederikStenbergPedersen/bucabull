// Shared between the match-history upload widget and the demo viewer
// page/components. DemoRecord covers the Demo model's own metadata
// fields, as sent by DemoController@show/@store — the rest of this file
// mirrors the compact replay JSON produced by go/internal/parse/schema.go
// (fetched separately by the viewer page, not part of the Inertia
// payload — see DemoController@data).

export type DemoStatusValue = 'processing' | 'ready' | 'failed';

export interface DemoRecord {
    id: number;
    map: string;
    status: DemoStatusValue;
    round_count: number | null;
    duration_seconds: number | null;
    error_message: string | null;
}

/** MapRadar::forSlug()'s shape — null whenever no radar art exists yet for the demo's map (see config/map_radar.php). */
export interface MapRadarCalibration {
    slug: string;
    radar_image: string;
    pos_x: number;
    pos_y: number;
    scale: number;
    lower_radar_image: string | null;
}

export type TeamSide = 'CT' | 'T' | '';

export interface PlayerFrame {
    steam_id: string;
    name: string;
    team: TeamSide;
    x: number;
    y: number;
    z: number;
    /** View yaw in degrees (0-360) — the direction the player is facing on the horizontal plane. */
    yaw: number;
    health: number;
    armor: number;
    weapon: string;
    is_alive: boolean;
    flash_duration: number;
}

export interface Frame {
    tick: number;
    time_s: number;
    players: PlayerFrame[];
}

export interface KillEvent {
    tick: number;
    time_s: number;
    killer_steam_id: string | null;
    victim_steam_id: string | null;
    assister_steam_id: string | null;
    weapon: string;
    headshot: boolean;
}

export type GrenadeType = 'smoke' | 'flashbang' | 'molotov' | 'incendiary' | 'hegrenade' | 'decoy' | 'unknown';

export interface TrajectoryPoint {
    tick: number;
    x: number;
    y: number;
    z: number;
}

export interface Point {
    x: number;
    y: number;
    z: number;
}

export interface GrenadeEvent {
    entity_id: number;
    type: GrenadeType;
    thrower_steam_id: string | null;
    throw_tick: number;
    detonate_tick: number | null;
    trajectory: TrajectoryPoint[];
    detonation: Point | null;
    /** Only set for smoke/molotov/incendiary — see the Go schema's comment on Grenade.EffectRadius. */
    effect_radius: number | null;
    effect_end_tick: number | null;
}

export interface Round {
    round_number: number;
    start_tick: number;
    end_tick: number;
    winner: TeamSide;
    end_reason: string;
    frames: Frame[];
    kills: KillEvent[];
    grenades: GrenadeEvent[];
}

/** The full document served by GET team.demos.data. */
export interface DemoReplay {
    map: string;
    tick_rate: number;
    rounds: Round[];
}
