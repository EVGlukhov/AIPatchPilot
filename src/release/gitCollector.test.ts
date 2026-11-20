import { execFileSync } from "node:child_process";
import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { findPreviousReleaseTag } from "./gitCollector.js";

test("finds previous release tag", async () => {
  const originalCwd = process.cwd();
  const repoDir = await mkdtemp(join(tmpdir(), "patchpilot-tags-"));

  try {
    const git = (...args: string[]) =>
      execFileSync("git", args, { cwd: repoDir, stdio: "ignore" });

    git("init", "-b", "main");
    git("config", "user.name", "PatchPilot Test");
    git("config", "user.email", "patchpilot-test@example.invalid");
    git("config", "commit.gpgsign", "false");

    await writeFile(join(repoDir, "README.md"), "first\n");
    git("add", "README.md");
    git("commit", "-m", "first commit");
    git("tag", "v0.1.0");

    process.chdir(repoDir);
    assert.equal(await findPreviousReleaseTag("v0.1.0"), null);

    await writeFile(join(repoDir, "README.md"), "second\n");
    git("add", "README.md");
    git("commit", "-m", "second commit");
    git("tag", "v0.2.0");

    assert.equal(await findPreviousReleaseTag("v0.2.0"), "v0.1.0");
  } finally {
    process.chdir(originalCwd);
    await rm(repoDir, { recursive: true, force: true });
  }
});
