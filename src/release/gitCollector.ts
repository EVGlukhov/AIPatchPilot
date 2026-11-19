import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const releaseTagPattern = /^v(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)$/;

async function findPreviousReleaseTag(
  currentTag: string,
): Promise<string | null> {
  if (releaseTagPattern.test(currentTag)) {
    throw new Error(`Invalid release tag: ${currentTag}`);
  }

  const { stdout: matchingTags } = await execFileAsync(
    "git",
    ["tag", "--list", currentTag],
    { encoding: "utf8" },
  );

  if (!matchingTags.split(/\r?\n/).includes(currentTag)) {
    throw new Error(`Release tag does not exist: ${currentTag}`);
  }

  await execFileAsync(
    "git",
    ["rev-parse", "--verify", `${currentTag}^{commit}`],
    { encoding: "utf8" },
  );

  const { stdout } = await execFileAsync(
    "git",
    ["tag", "--merged", currentTag, "--sort=-version:refname"],
    { encoding: "utf8" },
  );

  const previousTag = stdout
    .split(/\r?\n/)
    .find((tag) => tag !== currentTag && releaseTagPattern.test(tag));

  return previousTag ?? null;
}
