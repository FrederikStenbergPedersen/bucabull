package parse

import (
	"math"
	"strconv"

	"github.com/markus-wa/demoinfocs-golang/v5/pkg/demoinfocs/common"
	"github.com/markus-wa/demoinfocs-golang/v5/pkg/demoinfocs/events"
)

// Pure, demo-file-independent helpers — kept apart from parse.go so they
// have real unit tests (mapping_test.go) that don't need a fixture demo.

// defaultTickRate is used when the demo doesn't expose a usable tick rate
// (Parser.TickRate() <= 0, e.g. a corrupt/truncated header before the
// server-info net message arrives). CS2 matchmaking and Faceit servers
// run at 64 ticks, so that's the safe fallback rather than guessing 128.
const defaultTickRate = 64.0

// targetSampleSeconds is how often a position snapshot is kept — the
// full 64Hz+ position stream is far more than a 2D radar needs and would
// blow up the output size; ~200ms matches the sampling rate other
// browser-based CS demo viewers use.
const targetSampleSeconds = 0.2

// approxSmokeRadius/approxMolotovRadius are fixed approximations of each
// effect's ground footprint, not something demoinfocs-golang exposes as
// networked data (the real fire area for a molotov/incendiary is an
// irregular set of flame entities, available via GameState().Infernos()
// — using its real geometry instead of this constant is a natural
// follow-up, not implemented in this v1). Units match the demo's own
// world units (Hammer units).
const (
	approxSmokeRadius   = 144.0
	approxMolotovRadius = 180.0
)

// sampleIntervalTicks converts a demo's own tick rate into how many
// ticks to skip between recorded frames, landing close to
// targetSampleSeconds regardless of whether the server ran at 64 or 128
// ticks.
func sampleIntervalTicks(tickRate float64) int {
	if tickRate <= 0 {
		tickRate = defaultTickRate
	}

	interval := int(math.Round(targetSampleSeconds * tickRate))
	if interval < 1 {
		interval = 1
	}

	return interval
}

func teamString(team common.Team) string {
	switch team {
	case common.TeamCounterTerrorists:
		return "CT"
	case common.TeamTerrorists:
		return "T"
	default:
		return ""
	}
}

// grenadeTypeString maps demoinfocs' EquipmentType to the flat set of
// grenade type strings the frontend renders — see the demo viewer plan's
// JSON schema.
func grenadeTypeString(t common.EquipmentType) string {
	switch t {
	case common.EqSmoke:
		return "smoke"
	case common.EqFlash:
		return "flashbang"
	case common.EqMolotov:
		return "molotov"
	case common.EqIncendiary:
		return "incendiary"
	case common.EqHE:
		return "hegrenade"
	case common.EqDecoy:
		return "decoy"
	default:
		return "unknown"
	}
}

// effectRadiusFor returns the lingering-effect radius for grenade types
// that have one (smoke/molotov/incendiary), nil otherwise — see the
// EffectRadius field comment on Grenade.
func effectRadiusFor(grenadeType string) *float64 {
	var radius float64

	switch grenadeType {
	case "smoke":
		radius = approxSmokeRadius
	case "molotov", "incendiary":
		radius = approxMolotovRadius
	default:
		return nil
	}

	return &radius
}

func roundEndReasonString(r events.RoundEndReason) string {
	switch r {
	case events.RoundEndReasonTargetBombed:
		return "bomb_exploded"
	case events.RoundEndReasonBombDefused:
		return "bomb_defused"
	case events.RoundEndReasonCTWin:
		return "ct_win"
	case events.RoundEndReasonTerroristsWin:
		return "t_win"
	case events.RoundEndReasonDraw:
		return "draw"
	case events.RoundEndReasonTerroristsSurrender:
		return "t_surrender"
	case events.RoundEndReasonCTSurrender:
		return "ct_surrender"
	case events.RoundEndReasonHostagesRescued, events.RoundEndReasonHostagesNotRescued,
		events.RoundEndReasonTargetSaved, events.RoundEndReasonTerroristsNotEscaped,
		events.RoundEndReasonVIPEscaped, events.RoundEndReasonVIPKilled, events.RoundEndReasonVIPNotEscaped,
		events.RoundEndReasonTerroristsEscaped, events.RoundEndReasonCTStoppedEscape, events.RoundEndReasonTerroristsStopped,
		events.RoundEndReasonGameStart, events.RoundEndReasonTerroristsPlanted, events.RoundEndReasonCTsReachedHostage,
		events.RoundEndReasonStillInProgress:
		return "unknown" // game modes / states CS2 competitive play doesn't use
	default:
		return "unknown"
	}
}

// steamIDPtr formats a player's SteamID64 as a string pointer, or nil if
// the player reference itself is nil — Kill/GrenadeEvent's Killer,
// Victim, Assister and Thrower are all allowed to be nil per
// demoinfocs-golang's own docs (partially corrupt demos, world damage,
// POV demos).
func steamIDPtr(p *common.Player) *string {
	if p == nil {
		return nil
	}

	s := strconv.FormatUint(p.SteamID64, 10)

	return &s
}

func weaponString(e *common.Equipment) string {
	if e == nil {
		return ""
	}

	return e.String()
}
