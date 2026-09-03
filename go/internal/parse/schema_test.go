package parse

import (
	"encoding/json"
	"strings"
	"testing"
)

// Regression test for a real bug found against a real uploaded demo: a
// round with e.g. zero grenades thrown left that field as Go's nil slice
// zero value, which encoding/json marshals as `null` — breaking any
// consumer (PHP, TypeScript) that assumes these fields are always
// arrays. startRound() in parse.go now explicitly initializes them; this
// pins that behavior at the schema level without needing a real demo
// fixture to exercise startRound() itself.
func TestRoundWithNoEventsMarshalsEmptyArraysNotNull(t *testing.T) {
	round := Round{
		RoundNumber: 1,
		Frames:      []Frame{},
		Kills:       []Kill{},
		Grenades:    []*Grenade{},
	}

	data, err := json.Marshal(round)
	if err != nil {
		t.Fatalf("json.Marshal: %v", err)
	}

	got := string(data)

	for _, field := range []string{`"frames":[]`, `"kills":[]`, `"grenades":[]`} {
		if !strings.Contains(got, field) {
			t.Errorf("expected %s in %s", field, got)
		}
	}
	for _, field := range []string{`"frames":null`, `"kills":null`, `"grenades":null`} {
		if strings.Contains(got, field) {
			t.Errorf("did not expect %s in %s", field, got)
		}
	}
}

// The same nil-vs-empty-slice gotcha applies one level up: a demo with
// zero rounds (a corrupt/truncated capture) should still report
// `"rounds":[]`, not `"rounds":null`.
func TestOutputWithNoRoundsMarshalsEmptyArrayNotNull(t *testing.T) {
	out := Output{Map: "de_dust2", TickRate: 64, Rounds: []Round{}}

	data, err := json.Marshal(out)
	if err != nil {
		t.Fatalf("json.Marshal: %v", err)
	}

	if got := string(data); !strings.Contains(got, `"rounds":[]`) {
		t.Errorf("expected \"rounds\":[] in %s", got)
	}
}

func TestSummarize(t *testing.T) {
	cases := []struct {
		name string
		out  *Output
		want Summary
	}{
		{
			name: "no rounds",
			out:  &Output{TickRate: 64, Rounds: []Round{}},
			want: Summary{RoundCount: 0, DurationSeconds: 0},
		},
		{
			name: "unknown tick rate",
			out:  &Output{TickRate: 0, Rounds: []Round{{StartTick: 0, EndTick: 6400}}},
			want: Summary{RoundCount: 1, DurationSeconds: 0},
		},
		{
			name: "single round, 64 tick",
			out:  &Output{TickRate: 64, Rounds: []Round{{StartTick: 0, EndTick: 6400}}},
			want: Summary{RoundCount: 1, DurationSeconds: 100},
		},
		{
			name: "multiple rounds spans first start to last end",
			out: &Output{TickRate: 64, Rounds: []Round{
				{StartTick: 0, EndTick: 6400},
				{StartTick: 6400, EndTick: 12800},
				{StartTick: 12800, EndTick: 19264}, // +64 over an exact minute, rounds to 301s
			}},
			want: Summary{RoundCount: 3, DurationSeconds: 301},
		},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			got := summarize(tc.out)
			if got != tc.want {
				t.Errorf("summarize() = %+v, want %+v", got, tc.want)
			}
		})
	}
}
