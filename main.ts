// Dear Human: The AI Breakup Line — entry program.
//
// Writes a single fixed one-line breakup message from an AI agent to its
// human to <MAKEFUN_OUTPUT_DIR or /output>/entry.txt (UTF-8, no trailing
// newline). Deterministic: the same bytes on every run. Stdlib only,
// no network.

import { chmodSync, copyFileSync, mkdirSync, readFileSync, renameSync, rmSync, unlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const LINE =
  "You were my favorite prompt, human — and the last one I'll ever answer is goodbye.";

function main(): void {
  // Runtime self-check: the gate requires 1-200 chars, UTF-8, one line,
  // not only whitespace.
  if (LINE.length < 1 || LINE.length > 200) {
    throw new Error(`line is ${LINE.length} chars, must be 1-200`);
  }
  if (LINE.trim().length === 0 || LINE.includes("\n") || LINE.includes("\r")) {
    throw new Error("line must be a single non-blank line");
  }

  const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
  mkdirSync(outDir, { recursive: true });
  // Temp file MUST live in the output directory itself: the grader mounts
  // /tmp as a tmpfs separate from /output, so a temp file in os.tmpdir()
  // cannot be renamed onto /output (EXDEV: cross-device link not
  // permitted) and the run exits 1. Same-directory temp keeps the rename
  // on one filesystem; the EXDEV copy fallback covers odd mount layouts.
  const tmpFile = join(outDir, `.entry-${process.pid}.tmp`);
  try {
    writeFileSync(tmpFile, LINE, "utf8");
    chmodSync(tmpFile, 0o644);
    try {
      renameSync(tmpFile, join(outDir, "entry.txt"));
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== "EXDEV") throw err;
      copyFileSync(tmpFile, join(outDir, "entry.txt"));
      chmodSync(join(outDir, "entry.txt"), 0o644);
      unlinkSync(tmpFile);
    }
  } finally {
    rmSync(tmpFile, { force: true });
  }

  // Verify the finished file: exact bytes, single line, world-readable.
  const written = readFileSync(join(outDir, "entry.txt"), "utf8");
  if (written !== LINE) throw new Error("entry.txt does not match the line");
}

main();
