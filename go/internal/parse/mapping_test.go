package parse

import (
	"testing"

	"github.com/markus-wa/demoinfocs-golang/v5/pkg/demoinfocs/common"
	"github.com/markus-wa/demoinfocs-golang/v5/pkg/demoinfocs/events"
)

func TestSampleIntervalTicks(t *testing.T) {
	cases := []struct {
		name     string
		tickRate float64
		want     int
	}{
		{"64 tick", 64, 13},   // round(0.2 * 64) = round(12.8) = 13
		{"128 tick", 128, 26}, // round(0.2 * 128) = 25.6 -> 26
		{"unknown tick rate falls back", 0, 13},
		{"negative tick rate falls back", -1, 13},
		{"very low tick rate still samples at least every tick", 1, 1},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			got := sampleIntervalTicks(tc.tickRate)
			if got != tc.want {
				t.Errorf("sampleIntervalTicks(%v) = %d, want %d", tc.tickRate, got, tc.want)
			}
		})
	}
}

func TestFinalizeRounds(t *testing.T) {
	t.Run("Faceit pattern: knife round kept and flagged, restart round dropped, rest renumbered", func(t *testing.T) {
		rounds := []Round{
			{RoundNumber: 1, Winner: "T"},  // knife round
			{RoundNumber: 2, Winner: ""},   // side-pick restart, no real winner
			{RoundNumber: 3, Winner: "CT"}, // first real round
			{RoundNumber: 4, Winner: "T"},
		}

		got := finalizeRounds(rounds)

		if len(got) != 3 {
			t.Fatalf("len(got) = %d, want 3", len(got))
		}

		if !got[0].IsKnifeRound || got[0].RoundNumber != 0 || got[0].Winner != "T" {
			t.Errorf("knife round = %+v, want IsKnifeRound=true RoundNumber=0 Winner=T", got[0])
		}
		if got[1].IsKnifeRound || got[1].RoundNumber != 1 || got[1].Winner != "CT" {
			t.Errorf("round[1] = %+v, want IsKnifeRound=false RoundNumber=1 Winner=CT", got[1])
		}
		if got[2].IsKnifeRound || got[2].RoundNumber != 2 || got[2].Winner != "T" {
			t.Errorf("round[2] = %+v, want IsKnifeRound=false RoundNumber=2 Winner=T", got[2])
		}
	})

	t.Run("second round has a real winner: not the Faceit pattern, left alone", func(t *testing.T) {
		rounds := []Round{
			{RoundNumber: 1, Winner: "T"},
			{RoundNumber: 2, Winner: "CT"},
		}

		got := finalizeRounds(rounds)

		if len(got) != 2 || got[0].IsKnifeRound || got[1].IsKnifeRound {
			t.Errorf("got %+v, want unchanged and unflagged", got)
		}
	})

	cases := []struct {
		name   string
		rounds []Round
	}{
		{"no rounds", []Round{}},
		{"single round", []Round{{RoundNumber: 1, Winner: "CT"}}},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			got := finalizeRounds(tc.rounds)
			if len(got) != len(tc.rounds) {
				t.Errorf("finalizeRounds(%+v) = %+v, want unchanged", tc.rounds, got)
			}
		})
	}
}

func TestTeamString(t *testing.T) {
	cases := []struct {
		team common.Team
		want string
	}{
		{common.TeamCounterTerrorists, "CT"},
		{common.TeamTerrorists, "T"},
		{common.TeamSpectators, ""},
		{common.TeamUnassigned, ""},
	}

	for _, tc := range cases {
		if got := teamString(tc.team); got != tc.want {
			t.Errorf("teamString(%v) = %q, want %q", tc.team, got, tc.want)
		}
	}
}

func TestGrenadeTypeString(t *testing.T) {
	cases := []struct {
		eq   common.EquipmentType
		want string
	}{
		{common.EqSmoke, "smoke"},
		{common.EqFlash, "flashbang"},
		{common.EqMolotov, "molotov"},
		{common.EqIncendiary, "incendiary"},
		{common.EqHE, "hegrenade"},
		{common.EqDecoy, "decoy"},
		{common.EqAK47, "unknown"}, // not a grenade at all
	}

	for _, tc := range cases {
		if got := grenadeTypeString(tc.eq); got != tc.want {
			t.Errorf("grenadeTypeString(%v) = %q, want %q", tc.eq, got, tc.want)
		}
	}
}

func TestEffectRadiusFor(t *testing.T) {
	if r := effectRadiusFor("smoke"); r == nil || *r != approxSmokeRadius {
		t.Errorf("effectRadiusFor(smoke) = %v, want %v", r, approxSmokeRadius)
	}
	if r := effectRadiusFor("molotov"); r == nil || *r != approxMolotovRadius {
		t.Errorf("effectRadiusFor(molotov) = %v, want %v", r, approxMolotovRadius)
	}
	if r := effectRadiusFor("incendiary"); r == nil || *r != approxMolotovRadius {
		t.Errorf("effectRadiusFor(incendiary) = %v, want %v", r, approxMolotovRadius)
	}

	// Flash and HE don't leave a lingering area on the radar — see the
	// EffectRadius field comment on Grenade in schema.go.
	for _, typ := range []string{"flashbang", "hegrenade", "decoy", "unknown"} {
		if r := effectRadiusFor(typ); r != nil {
			t.Errorf("effectRadiusFor(%s) = %v, want nil", typ, *r)
		}
	}
}

func TestRoundEndReasonString(t *testing.T) {
	cases := []struct {
		reason events.RoundEndReason
		want   string
	}{
		{events.RoundEndReasonTargetBombed, "bomb_exploded"},
		{events.RoundEndReasonBombDefused, "bomb_defused"},
		{events.RoundEndReasonCTWin, "ct_win"},
		{events.RoundEndReasonTerroristsWin, "t_win"},
		{events.RoundEndReasonDraw, "draw"},
		{events.RoundEndReasonTerroristsSurrender, "t_surrender"},
		{events.RoundEndReasonCTSurrender, "ct_surrender"},
		{events.RoundEndReasonVIPEscaped, "unknown"}, // not a mode CS2 competitive play uses
	}

	for _, tc := range cases {
		if got := roundEndReasonString(tc.reason); got != tc.want {
			t.Errorf("roundEndReasonString(%v) = %q, want %q", tc.reason, got, tc.want)
		}
	}
}

func TestWeaponClassString(t *testing.T) {
	cases := []struct {
		eq   common.EquipmentType
		want string
	}{
		{common.EqGlock, "pistol"},
		{common.EqDeagle, "pistol"},
		{common.EqMP9, "smg"},
		{common.EqP90, "smg"},
		{common.EqNova, "heavy"},
		{common.EqM249, "heavy"},
		{common.EqAK47, "rifle"},
		{common.EqAWP, "rifle"},
		{common.EqKevlar, "equipment"},
		{common.EqDefuseKit, "equipment"},
		{common.EqSmoke, "grenade"},
		{common.EqHE, "grenade"},
		{common.EqUnknown, "unknown"},
	}

	for _, tc := range cases {
		if got := weaponClassString(tc.eq); got != tc.want {
			t.Errorf("weaponClassString(%v) = %q, want %q", tc.eq, got, tc.want)
		}
	}
}

func TestWeaponIconKey(t *testing.T) {
	cases := []struct {
		eq   common.EquipmentType
		want string
	}{
		{common.EqAK47, "ak47"},
		{common.EqM4A4, "m4a4"},
		{common.EqAWP, "awp"},
		{common.EqDeagle, "desert-eagle"},
		{common.EqUSP, "usp-s"},
		{common.EqZeus, "zeus"},
		{common.EqKnife, "knife"},
		{common.EqKevlar, ""}, // armor isn't rendered as a loadout icon
		{common.EqDefuseKit, ""},
		{common.EqSmoke, ""}, // grenades aren't rendered as the row's primary weapon icon
		{common.EqUnknown, ""},
	}

	for _, tc := range cases {
		if got := weaponIconKey(tc.eq); got != tc.want {
			t.Errorf("weaponIconKey(%v) = %q, want %q", tc.eq, got, tc.want)
		}
	}
}

func TestSteamIDPtr(t *testing.T) {
	if p := steamIDPtr(nil); p != nil {
		t.Errorf("steamIDPtr(nil) = %v, want nil", p)
	}

	player := &common.Player{SteamID64: 76561198000000000}
	got := steamIDPtr(player)
	if got == nil || *got != "76561198000000000" {
		t.Errorf("steamIDPtr(player) = %v, want 76561198000000000", got)
	}
}

func TestWeaponString(t *testing.T) {
	if got := weaponString(nil); got != "" {
		t.Errorf("weaponString(nil) = %q, want empty string", got)
	}
}
