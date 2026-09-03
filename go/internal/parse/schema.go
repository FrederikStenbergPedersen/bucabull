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
	RoundNumber int    `json:"round_number"`
	StartTick   int    `json:"start_tick"`
	EndTick     int    `json:"end_tick"`
	Winner      string `json:"winner"` // "CT" | "T" | "" (draw/unknown)
	EndReason   string `json:"end_reason"`
	// IsKnifeRound marks the pre-match knife round Faceit (and most
	// competitive setups) plays to decide starting sides — everyone plays
	// it with $0 and only a knife. It's real data worth keeping, just not
	// a scored round: RoundNumber is 0 for it rather than taking the 1
	// slot real rounds are numbered from. See finalizeRounds.
	IsKnifeRound bool    `json:"is_knife_round"`
	Frames       []Frame `json:"frames"`
	Kills        []Kill  `json:"kills"`
	// Pointers, not values: a grenade record is created once (on throw)
	// and then mutated in place by later events (destroy, smoke
	// start/expired, ...) looked up by entity ID — a []Grenade would let
	// slice growth relocate the backing array and silently invalidate
	// any pointer taken into it earlier. encoding/json dereferences
	// pointers automatically, so the JSON shape is identical either way.
	Grenades []*Grenade `json:"grenades"`
	// Loadouts is a once-per-round snapshot, taken at freeze-time-end (see
	// onRoundFreezetimeEnd) — unlike Frames, it's not resampled through
	// the round, since a player's starting buy doesn't change after live
	// round time begins.
	Loadouts []PlayerLoadout `json:"loadouts"`
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

// LoadoutWeapon is one item in a player's inventory at freeze-time-end —
// this includes grenades and non-weapon equipment (armor, defuse kit),
// not just guns; IconKey is empty for anything that isn't rendered as the
// loadout row's primary weapon icon.
type LoadoutWeapon struct {
	Name    string `json:"name"`     // display name, via weaponString() — same helper PlayerFrame.Weapon already uses
	Class   string `json:"class"`    // pistol | smg | heavy | rifle | equipment | grenade | unknown
	IconKey string `json:"icon_key"` // "" if this item has no icon
}

// PlayerLoadout is one player's starting-round economy/loadout snapshot —
// see Round.Loadouts and onRoundFreezetimeEnd.
type PlayerLoadout struct {
	SteamID        string          `json:"steam_id"`
	Name           string          `json:"name"`
	Team           string          `json:"team"` // "CT" | "T" | ""
	Money          int             `json:"money"`
	EquipmentValue int             `json:"equipment_value"`
	Armor          int             `json:"armor"`
	HasHelmet      bool            `json:"has_helmet"`
	HasDefuseKit   bool            `json:"has_defuse_kit"`
	Weapons        []LoadoutWeapon `json:"weapons"` // full inventory, not just the active weapon
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
