package parse

// Output is the top-level JSON document written to a Demo's
// parsed_disk_path — see the demo viewer plan's JSON schema. Rounds own
// their own frames/kills/grenades so the frontend never has to re-derive
// round boundaries from a flat event stream.
type Output struct {
	Map      string  `json:"map"`
	TickRate float64 `json:"tick_rate"`
	Rounds   []Round `json:"rounds"`
}

type Round struct {
	RoundNumber int     `json:"round_number"`
	StartTick   int     `json:"start_tick"`
	EndTick     int     `json:"end_tick"`
	Winner      string  `json:"winner"` // "CT" | "T" | "" (draw/unknown)
	EndReason   string  `json:"end_reason"`
	Frames      []Frame `json:"frames"`
	Kills       []Kill  `json:"kills"`
	// Pointers, not values: a grenade record is created once (on throw)
	// and then mutated in place by later events (destroy, smoke
	// start/expired, ...) looked up by entity ID — a []Grenade would let
	// slice growth relocate the backing array and silently invalidate
	// any pointer taken into it earlier. encoding/json dereferences
	// pointers automatically, so the JSON shape is identical either way.
	Grenades []*Grenade `json:"grenades"`
}

// Frame is one sampled snapshot of every player's state — see
// sampleIntervalTicks for how often these are recorded.
type Frame struct {
	Tick    int           `json:"tick"`
	TimeS   float64       `json:"time_s"`
	Players []PlayerFrame `json:"players"`
}

type PlayerFrame struct {
	SteamID       string  `json:"steam_id"`
	Name          string  `json:"name"`
	Team          string  `json:"team"` // "CT" | "T" | ""
	X             float64 `json:"x"`
	Y             float64 `json:"y"`
	Z             float64 `json:"z"`
	Yaw           float64 `json:"yaw"`
	Health        int     `json:"health"`
	Armor         int     `json:"armor"`
	Weapon        string  `json:"weapon"`
	IsAlive       bool    `json:"is_alive"`
	FlashDuration float64 `json:"flash_duration"`
}

type Kill struct {
	Tick            int     `json:"tick"`
	TimeS           float64 `json:"time_s"`
	KillerSteamID   *string `json:"killer_steam_id"`
	VictimSteamID   *string `json:"victim_steam_id"`
	AssisterSteamID *string `json:"assister_steam_id"`
	Weapon          string  `json:"weapon"`
	Headshot        bool    `json:"headshot"`
}

// Grenade covers a single thrown grenade's whole lifecycle: the flight
// (Trajectory) plus, for smoke/molotov/incendiary, the lingering effect
// after detonation (Detonation/EffectRadius/EffectEndTick). EntityID is
// demoinfocs' GrenadeProjectile.UniqueID() — deliberately not the raw
// network entity ID, which gets reused within a single demo and would
// collide across different grenades.
type Grenade struct {
	EntityID       int64             `json:"entity_id"`
	Type           string            `json:"type"` // smoke | flashbang | molotov | incendiary | hegrenade | decoy
	ThrowerSteamID *string           `json:"thrower_steam_id"`
	ThrowTick      int               `json:"throw_tick"`
	DetonateTick   *int              `json:"detonate_tick"`
	Trajectory     []TrajectoryPoint `json:"trajectory"`
	Detonation     *Point            `json:"detonation"`
	// EffectRadius/EffectEndTick are only set for smoke/molotov/incendiary
	// — flash has no lingering area (see PlayerFrame.FlashDuration
	// instead) and HE's blast is instantaneous.
	EffectRadius  *float64 `json:"effect_radius"`
	EffectEndTick *int     `json:"effect_end_tick"`
}

type TrajectoryPoint struct {
	Tick int     `json:"tick"`
	X    float64 `json:"x"`
	Y    float64 `json:"y"`
	Z    float64 `json:"z"`
}

type Point struct {
	X float64 `json:"x"`
	Y float64 `json:"y"`
	Z float64 `json:"z"`
}
