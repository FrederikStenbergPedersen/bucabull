package main

import (
	"bytes"
	"path/filepath"
	"strings"
	"testing"
)

func TestRunMissingFlags(t *testing.T) {
	var stdout, stderr bytes.Buffer

	code := run([]string{}, &stdout, &stderr)

	if code != exitUsage {
		t.Errorf("exit code = %d, want %d (exitUsage)", code, exitUsage)
	}
	if !strings.Contains(stderr.String(), "usage:") {
		t.Errorf("stderr = %q, want a usage message", stderr.String())
	}
}

func TestRunOnlyInFlag(t *testing.T) {
	var stdout, stderr bytes.Buffer

	code := run([]string{"-in", "demo.dem"}, &stdout, &stderr)

	if code != exitUsage {
		t.Errorf("exit code = %d, want %d (exitUsage)", code, exitUsage)
	}
}

func TestRunBadFlag(t *testing.T) {
	var stdout, stderr bytes.Buffer

	code := run([]string{"-not-a-flag"}, &stdout, &stderr)

	if code != exitUsage {
		t.Errorf("exit code = %d, want %d (exitUsage)", code, exitUsage)
	}
}

func TestRunParseFailureOnMissingFile(t *testing.T) {
	var stdout, stderr bytes.Buffer
	outPath := filepath.Join(t.TempDir(), "out.json")

	code := run([]string{"-in", filepath.Join(t.TempDir(), "does-not-exist.dem"), "-out", outPath}, &stdout, &stderr)

	if code != exitParse {
		t.Errorf("exit code = %d, want %d (exitParse)", code, exitParse)
	}
	if !strings.Contains(stderr.String(), "parse failed") {
		t.Errorf("stderr = %q, want a parse failure message", stderr.String())
	}
	if stdout.Len() != 0 {
		t.Errorf("stdout = %q, want empty on failure", stdout.String())
	}
}
