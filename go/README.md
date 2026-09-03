# democompact

The server-side half of the 2D demo viewer (see the demo viewer plan): a
small CLI that turns a raw CS2 `.dem` file into the compact, round-by-round
JSON the frontend replays. Built on
[demoinfocs-golang](https://github.com/markus-wa/demoinfocs-golang) — this
module exists so the app's queue worker can shell out to a single compiled
binary instead of the Laravel app needing a Go/CGo runtime itself.

## Layout

- `cmd/democompact` — the CLI entry point (flag parsing, exit codes).
- `internal/parse` — the actual parsing logic and the JSON schema
  (`schema.go`), kept as a library package so it's testable independently
  of the CLI wrapper.

## CLI contract

```
democompact -in <path/to/demo.dem> -out <path/to/output.json>
```

- Exit `0` — success, `-out` was written.
- Exit `1` — parse failure (corrupt/unsupported demo); message on stderr.
- Exit `2` — usage error (missing/bad flags).

`ParseDemoJob` (`app/Jobs/ParseDemoJob.php`) is the caller — see its
comment for how exit codes map onto a `Demo` row's status.

## Building

```
cd go
go build -o democompact ./cmd/democompact
```

The production image builds this in its own Dockerfile stage (see the
repo's `Dockerfile`) — no Go toolchain is needed at runtime, only the
compiled binary.

## Testing

```
cd go
go test ./...
```

`internal/parse`'s pure mapping/sampling helpers (grenade type strings,
round-end-reason strings, the sample-interval calculation) have real unit
tests in `mapping_test.go` — no demo file required.

**What's not covered yet**: an end-to-end test that actually runs
`Parse()` against a real `.dem` file. demoinfocs-golang's own test suite
pulls fixture demos from a Git-LFS-backed companion repo
(https://gitlab.com/markus-wa/cs-demos-2) — genuine CS2 demo recordings
are large binary files with real players' gameplay in them, so vendoring
one into `go/testdata/` needs its own deliberate call (size, and whether
it's appropriate to commit into this repo) rather than picking one
arbitrarily. Until then, correctness of the actual demoinfocs-golang
integration in `parse.go` is verified by compiling/vetting against the
real library (`go build`, `go vet`) plus manual testing against a real
upload (see the demo viewer plan's Slice 2 verification steps) — not by
an automated fixture test.
