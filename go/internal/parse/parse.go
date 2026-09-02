// Package parse turns a raw CS2 demo into the compact JSON described in
// the 2D demo viewer plan, using demoinfocs-golang to do the actual
// protocol/entity work.
package parse

import (
	"encoding/json"
	"fmt"
	"io"
	"os"
	"time"

	"github.com/golang/geo/r3"
	demoinfocs "github.com/markus-wa/demoinfocs-golang/v5/pkg/demoinfocs"
	"github.com/markus-wa/demoinfocs-golang/v5/pkg/demoinfocs/events"
	"github.com/markus-wa/demoinfocs-golang/v5/pkg/demoinfocs/msg"
)

// Summary is a small report of what got written, returned alongside the
// full parse so the caller (ParseDemoJob) doesn't have to read the
// output file back and re-decode the whole thing — which, for a real
// full match (tens of MB of JSON), is exactly the kind of avoidable
// memory spike this whole tool exists to keep out of the PHP process.
type Summary struct {
	RoundCount      int `json:"round_count"`
	DurationSeconds int `json:"duration_seconds"`
}

func summarize(out *Output) Summary {
	if len(out.Rounds) == 0 || out.TickRate <= 0 {
		return Summary{RoundCount: len(out.Rounds)}
	}

	first := out.Rounds[0].StartTick
	last := out.Rounds[len(out.Rounds)-1].EndTick
	span := last - first
	if span < 0 {
		span = 0
	}

	return Summary{
		RoundCount:      len(out.Rounds),
		DurationSeconds: int(float64(span)/out.TickRate + 0.5), // round to nearest second
	}
}

// File parses the demo at inPath and writes the compact JSON to outPath.
// This is the entry point cmd/democompact calls.
func File(inPath, outPath string) (Summary, error) {
	in, err := os.Open(inPath)
	if err != nil {
		return Summary{}, fmt.Errorf("opening demo: %w", err)
	}
	defer in.Close()

	out, err := Parse(in)
	if err != nil {
		return Summary{}, err
	}

	data, err := json.Marshal(out)
	if err != nil {
		return Summary{}, fmt.Errorf("encoding output: %w", err)
	}

	if err := os.WriteFile(outPath, data, 0o644); err != nil {
		return Summary{}, fmt.Errorf("writing output: %w", err)
	}

	return summarize(out), nil
}

// state accumulates parser output while demoinfocs-golang streams events
// in. Kept separate from the exported schema types so parsing-only
// bookkeeping (lookup maps, the in-progress round) doesn't leak into the
// JSON shape.
type state struct {
	parser demoinfocs.Parser
	out    *Output

	current        *Round        // nil outside an active round — see startRound/endRound
	roundStartTime time.Duration // CurrentTime() at the current round's RoundStart, for TimeS below

	sampleTicks int // computed once TickRate() is known, see ensureSampleInterval
	lastSampled int // last tick a Frame was recorded on, so FrameDone can gate on the interval

	grenades    map[int64]*Grenade // by GrenadeProjectile.UniqueID() — the live/finished grenades this demo has seen
	entityToUID map[int]int64      // raw network entity ID -> UniqueID, valid only around a single grenade's own lifetime (see mapping.go's package comment on entity ID reuse)
}

// Parse runs demoinfocs-golang over r and returns the compact,
// round-by-round replay data described in the 2D demo viewer plan.
func Parse(r io.Reader) (*Output, error) {
	p := demoinfocs.NewParser(r)
	defer p.Close()

	s := &state{
		parser:      p,
		out:         &Output{Rounds: []Round{}}, // see startRound()'s comment on nil slices marshaling to `null`
		grenades:    map[int64]*Grenade{},
		entityToUID: map[int]int64{},
	}

	// The map name is only available via the server-info net message —
	// there's no public Parser.Header()/MapName() accessor for CS2
	// (Source 2) demos, see the official print-events example.
	p.RegisterNetMessageHandler(func(m *msg.CSVCMsg_ServerInfo) {
		s.out.Map = m.GetMapName()
	})

	p.RegisterEventHandler(s.onRoundStart)
	p.RegisterEventHandler(s.onRoundEnd)
	p.RegisterEventHandler(s.onFrameDone)
	p.RegisterEventHandler(s.onKill)
	p.RegisterEventHandler(s.onGrenadeThrow)
	p.RegisterEventHandler(s.onGrenadeDestroy)
	p.RegisterEventHandler(s.onSmokeStart)
	p.RegisterEventHandler(s.onSmokeExpired)
	p.RegisterEventHandler(s.onFireStart)
	p.RegisterEventHandler(s.onFireExpired)
	p.RegisterEventHandler(s.onHeExplode)
	p.RegisterEventHandler(s.onFlashExplode)
	p.RegisterEventHandler(s.onDecoyStart)

	if err := p.ParseToEnd(); err != nil {
		return nil, fmt.Errorf("parsing demo: %w", err)
	}

	// A round that never got an official RoundEnd (the demo was cut off
	// mid-round, e.g. a recording that stops early) still has data worth
	// keeping — flush it rather than silently dropping the last round.
	s.flushIncompleteRound("demo_ended")

	s.out.TickRate = s.parser.TickRate()

	return s.out, nil
}

func (s *state) startRound() {
	s.current = &Round{
		RoundNumber: len(s.out.Rounds) + 1,
		StartTick:   s.parser.CurrentFrame(),
		// A round with e.g. zero grenades thrown never appends to this
		// slice, leaving it nil — encoding/json marshals a nil slice as
		// `null`, not `[]`, which breaks any consumer (this app's own
		// PHP/TS included) that assumes these fields are always arrays.
		// Explicit empty slices here, not just `append`'s zero value.
		Frames:   []Frame{},
		Kills:    []Kill{},
		Grenades: []*Grenade{},
	}
	s.roundStartTime = s.parser.CurrentTime()
}

func (s *state) onRoundStart(events.RoundStart) {
	// A round that starts without ever seeing its own RoundEnd — seen in
	// real demos, e.g. a round restart mid-round — would otherwise be
	// silently discarded when the next round overwrites s.current; flush
	// it first, same handling as the end-of-parse flush in Parse().
	s.flushIncompleteRound("round_restarted")

	s.startRound()
}

// flushIncompleteRound appends s.current (if any) to the output with an
// honest end-of-round marker, for the two situations where a round never
// gets a real RoundEnd event: leaving EndTick/Winner/EndReason at their
// Go zero values (0/""/"") would look like "the round ended before it
// started" rather than "we don't actually know how this round ended".
func (s *state) flushIncompleteRound(reason string) {
	if s.current == nil {
		return
	}

	s.current.EndTick = s.parser.CurrentFrame()
	s.current.EndReason = reason

	s.out.Rounds = append(s.out.Rounds, *s.current)
	s.current = nil
}

func (s *state) onRoundEnd(e events.RoundEnd) {
	if s.current == nil {
		return
	}

	s.current.EndTick = s.parser.CurrentFrame()
	s.current.Winner = teamString(e.Winner)
	s.current.EndReason = roundEndReasonString(e.Reason)

	s.out.Rounds = append(s.out.Rounds, *s.current)
	s.current = nil
}

// ensureSampleInterval computes the sample interval on first use — the
// tick rate isn't reliably known until the server-info net message has
// arrived, which happens before real gameplay frames but not necessarily
// before Parse() has registered handlers.
func (s *state) ensureSampleInterval() int {
	if s.sampleTicks == 0 {
		s.sampleTicks = sampleIntervalTicks(s.parser.TickRate())
	}

	return s.sampleTicks
}

func (s *state) timeSince(t time.Duration) float64 {
	return (s.parser.CurrentTime() - t).Seconds()
}

func (s *state) onFrameDone(events.FrameDone) {
	if s.current == nil {
		return
	}

	tick := s.parser.CurrentFrame()
	interval := s.ensureSampleInterval()

	if s.lastSampled != 0 && tick-s.lastSampled < interval {
		return
	}

	s.lastSampled = tick

	playing := s.parser.GameState().Participants().Playing()
	players := make([]PlayerFrame, 0, len(playing))

	for _, pl := range playing {
		pos := pl.Position()

		players = append(players, PlayerFrame{
			SteamID:       fmt.Sprintf("%d", pl.SteamID64),
			Name:          pl.Name,
			Team:          teamString(pl.Team),
			X:             pos.X,
			Y:             pos.Y,
			Z:             pos.Z,
			Yaw:           float64(pl.ViewDirectionX()),
			Health:        pl.Health(),
			Armor:         pl.Armor(),
			Weapon:        weaponString(pl.ActiveWeapon()),
			IsAlive:       pl.IsAlive(),
			FlashDuration: float64(pl.FlashDuration),
		})
	}

	s.current.Frames = append(s.current.Frames, Frame{
		Tick:    tick,
		TimeS:   s.timeSince(s.roundStartTime),
		Players: players,
	})
}

func (s *state) onKill(e events.Kill) {
	if s.current == nil {
		return
	}

	s.current.Kills = append(s.current.Kills, Kill{
		Tick:            s.parser.CurrentFrame(),
		TimeS:           s.timeSince(s.roundStartTime),
		KillerSteamID:   steamIDPtr(e.Killer),
		VictimSteamID:   steamIDPtr(e.Victim),
		AssisterSteamID: steamIDPtr(e.Assister),
		Weapon:          weaponString(e.Weapon),
		Headshot:        e.IsHeadshot,
	})
}

func (s *state) onGrenadeThrow(e events.GrenadeProjectileThrow) {
	if s.current == nil || e.Projectile == nil {
		return
	}

	grenadeType := "unknown"
	if e.Projectile.WeaponInstance != nil {
		grenadeType = grenadeTypeString(e.Projectile.WeaponInstance.Type)
	}

	uid := e.Projectile.UniqueID()

	g := &Grenade{
		EntityID:       uid,
		Type:           grenadeType,
		ThrowerSteamID: steamIDPtr(e.Projectile.Thrower),
		ThrowTick:      s.parser.CurrentFrame(),
		EffectRadius:   effectRadiusFor(grenadeType),
	}

	s.current.Grenades = append(s.current.Grenades, g)
	s.grenades[uid] = g

	if e.Projectile.Entity != nil {
		s.entityToUID[e.Projectile.Entity.ID()] = uid
	}
}

func (s *state) onGrenadeDestroy(e events.GrenadeProjectileDestroy) {
	if e.Projectile == nil {
		return
	}

	g, ok := s.grenades[e.Projectile.UniqueID()]
	if !ok {
		return
	}

	trajectory := make([]TrajectoryPoint, 0, len(e.Projectile.Trajectory))
	for _, entry := range e.Projectile.Trajectory {
		trajectory = append(trajectory, TrajectoryPoint{Tick: entry.Tick, X: entry.Position.X, Y: entry.Position.Y, Z: entry.Position.Z})
	}
	g.Trajectory = trajectory

	s.recordDetonation(g, e.Projectile.Position())
}

// recordDetonation fills in a grenade's detonation point/tick the first
// time we see one — GrenadeProjectileDestroy and the type-specific
// explode/start events (SmokeStart, HeExplode, ...) aren't guaranteed to
// fire in a fixed order relative to each other, so every caller goes
// through this same "set once" path rather than assuming which fires
// first.
func (s *state) recordDetonation(g *Grenade, pos r3.Vector) {
	if g.Detonation != nil {
		return
	}

	tick := s.parser.CurrentFrame()
	g.DetonateTick = &tick
	g.Detonation = &Point{X: pos.X, Y: pos.Y, Z: pos.Z}
}

func (s *state) grenadeByEntityID(entityID int) (*Grenade, bool) {
	uid, ok := s.entityToUID[entityID]
	if !ok {
		return nil, false
	}

	g, ok := s.grenades[uid]

	return g, ok
}

func (s *state) onSmokeStart(e events.SmokeStart) {
	if g, ok := s.grenadeByEntityID(e.GrenadeEntityID); ok {
		s.recordDetonation(g, e.Position)
	}
}

func (s *state) onSmokeExpired(e events.SmokeExpired) {
	s.recordEffectEnd(e.GrenadeEntityID)
}

// onFireStart/onFireExpired: FireGrenadeStart/Expired fire for both
// Molotovs and Incendiaries with GrenadeType always reported as
// Incendiary (see demoinfocs-golang's own comment on FireGrenadeStart) —
// the real type was already captured at throw time from the equipped
// weapon, so these handlers only ever touch Detonation/EffectEndTick,
// never Type.
func (s *state) onFireStart(e events.FireGrenadeStart) {
	if g, ok := s.grenadeByEntityID(e.GrenadeEntityID); ok {
		s.recordDetonation(g, e.Position)
	}
}

func (s *state) onFireExpired(e events.FireGrenadeExpired) {
	s.recordEffectEnd(e.GrenadeEntityID)
}

func (s *state) recordEffectEnd(entityID int) {
	g, ok := s.grenadeByEntityID(entityID)
	if !ok {
		return
	}

	tick := s.parser.CurrentFrame()
	g.EffectEndTick = &tick
}

func (s *state) onHeExplode(e events.HeExplode) {
	if g, ok := s.grenadeByEntityID(e.GrenadeEntityID); ok {
		s.recordDetonation(g, e.Position)
	}
}

func (s *state) onFlashExplode(e events.FlashExplode) {
	if g, ok := s.grenadeByEntityID(e.GrenadeEntityID); ok {
		s.recordDetonation(g, e.Position)
	}
}

func (s *state) onDecoyStart(e events.DecoyStart) {
	if g, ok := s.grenadeByEntityID(e.GrenadeEntityID); ok {
		s.recordDetonation(g, e.Position)
	}
}
