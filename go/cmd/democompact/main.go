// Command democompact turns a raw CS2 demo into the compact JSON the 2D
// demo viewer replays — see go/README.md for the CLI contract and
// app/Jobs/ParseDemoJob.php for the caller.
package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"io"
	"os"

	"bucabull/democompact/internal/parse"
)

const (
	exitOK    = 0
	exitParse = 1
	exitUsage = 2
)

func main() {
	os.Exit(run(os.Args[1:], os.Stdout, os.Stderr))
}

func run(args []string, stdout, stderr io.Writer) int {
	fs := flag.NewFlagSet("democompact", flag.ContinueOnError)
	fs.SetOutput(stderr)

	inPath := fs.String("in", "", "path to the .dem file to parse")
	outPath := fs.String("out", "", "path to write the compact JSON output to")

	if err := fs.Parse(args); err != nil {
		return exitUsage
	}

	if *inPath == "" || *outPath == "" {
		fmt.Fprintln(stderr, "usage: democompact -in <demo.dem> -out <output.json>")
		return exitUsage
	}

	summary, err := parse.File(*inPath, *outPath)
	if err != nil {
		fmt.Fprintln(stderr, "parse failed:", err)
		return exitParse
	}

	// A small summary on stdout, not the full -out file, so the caller
	// (ParseDemoJob) never has to re-read/decode a potentially tens-of-MB
	// JSON file just to learn a round count and a duration.
	data, err := json.Marshal(summary)
	if err != nil {
		fmt.Fprintln(stderr, "encoding summary:", err)
		return exitParse
	}
	fmt.Fprintln(stdout, string(data))

	return exitOK
}
