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
