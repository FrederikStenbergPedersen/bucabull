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

// finalizeRounds applies Faceit's known pre-match quirks to the rounds a
// full parse collected, and renumbers what's left:
//
//  1. Faceit plays a knife round before the match to decide starting
//     sides — everyone starts it with $0 and only a knife (the buy menu
//     is locked). That round is kept, just flagged (IsKnifeRound), not
//     discarded, so the viewer can still show it.
//  2. Whichever side wins the knife picks a side and the game restarts to
//     apply it — in the demo that's a second RoundStart/RoundEnd pair
//     that never gets a real winner. It carries no real round data and
//     is dropped outright.
//  3. Everything left is renumbered from 1, so raw round 3 (the first
//     real round, after the two above) reads as "Round 1" in the viewer.
//     The knife round keeps RoundNumber 0 rather than taking the 1 slot.
//
// Only applied when the shape actually matches — at least two rounds,
// and the second one really has no winner. A demo that doesn't start
// this way (not from Faceit, or cut off before round 2 ever finished)
// passes through unchanged rather than losing a real round.
func finalizeRounds(rounds []Round) []Round {
	if len(rounds) < 2 || rounds[1].Winner != "" {
		return rounds
	}

	rounds[0].IsKnifeRound = true
	out := append(rounds[:1], rounds[2:]...)

	real := 0
	for i := range out {
		if out[i].IsKnifeRound {
			out[i].RoundNumber = 0
			continue
		}

		real++
		out[i].RoundNumber = real
	}

	return out
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
// weaponClassString maps demoinfocs' EquipmentClass (derived arithmetically
// by common.EquipmentType.Class(), not something this package computes
// itself) to the flat strings the frontend groups/prioritizes loadout
// weapons by — see the demo viewer plan's loadout schema.
func weaponClassString(t common.EquipmentType) string {
	switch t.Class() {
	case common.EqClassPistols:
		return "pistol"
	case common.EqClassSMG:
		return "smg"
	case common.EqClassHeavy:
		return "heavy"
	case common.EqClassRifle:
		return "rifle"
	case common.EqClassEquipment:
		return "equipment"
	case common.EqClassGrenade:
		return "grenade"
	default:
		return "unknown"
	}
}

// weaponIconKey maps a gun (plus Zeus/Knife) to the filename-safe key its
// icon is vendored under (public/weapons/{key}.svg) — see the demo viewer
// plan. Empty string for anything that isn't rendered as a loadout icon
// (armor, defuse kit, C4, grenades, ...), which is a valid "no icon for
// this item" result, not an error.
func weaponIconKey(t common.EquipmentType) string {
	switch t {
	// Rifles
	case common.EqAK47:
		return "ak47"
	case common.EqAUG:
		return "aug"
	case common.EqAWP:
		return "awp"
	case common.EqFamas:
		return "famas"
	case common.EqGalil:
		return "galil"
	case common.EqM4A4:
		return "m4a4"
	case common.EqM4A1:
		return "m4a1"
	case common.EqScar20:
		return "scar20"
	case common.EqSG553:
		return "sg553"
	case common.EqScout:
		return "ssg08"
	case common.EqG3SG1:
		return "g3sg1"
	// SMGs
	case common.EqMP7:
		return "mp7"
	case common.EqMP9:
		return "mp9"
	case common.EqBizon:
		return "bizon"
	case common.EqMac10:
		return "mac10"
	case common.EqUMP:
		return "ump45"
	case common.EqP90:
		return "p90"
	case common.EqMP5:
		return "mp5"
	// Heavy
	case common.EqSawedOff:
		return "sawed-off"
	case common.EqNova:
		return "nova"
	case common.EqSwag7:
		return "mag7"
	case common.EqXM1014:
		return "xm1014"
	case common.EqM249:
		return "m249"
	case common.EqNegev:
		return "negev"
	// Pistols
	case common.EqP2000:
		return "p2000"
	case common.EqGlock:
		return "glock"
	case common.EqP250:
		return "p250"
	case common.EqDeagle:
		return "desert-eagle"
	case common.EqFiveSeven:
		return "five-seven"
	case common.EqDualBerettas:
		return "dual-berettas"
	case common.EqTec9:
		return "tec9"
	case common.EqCZ:
		return "cz75"
	case common.EqUSP:
		return "usp-s"
	case common.EqRevolver:
		return "revolver"
	// Bought "weapons" that aren't guns, but still get a loadout icon.
	case common.EqZeus:
		return "zeus"
	case common.EqKnife:
		return "knife"
	default:
		return ""
	}
}

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
