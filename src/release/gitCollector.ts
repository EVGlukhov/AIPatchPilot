import { execFile } from "node:child_process";
import { promisify } from "node:util";
import {
  CHANGED_FILE_STATUS,
  type ChangedFile,
  type ChangedFileStatus,
  type CommitRecord,
} from "./types.js";

const execFileAsync = promisify(execFile);

const releaseTagPattern = /^v(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)$/;

export async function findPreviousReleaseTag(
  currentTag: string,
): Promise<string | null> {
  if (!releaseTagPattern.test(currentTag)) {
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

export async function collectCommits(
  currentTag: string,
  previousTag: string | null,
  repository: string,
): Promise<CommitRecord[]> {
  const revision = previousTag ? `${previousTag}..${currentTag}` : currentTag;

  const { stdout } = await execFileAsync(
    "git",
    ["log", "--format=%H%x1f%an%x1f%s", revision],
    { encoding: "utf8" },
  );

  return stdout
    .split(/\r?\n/)
    .filter((line) => line.length > 0)
    .map((line) => {
      const parts = line.split("\x1f");
      const sha = parts[0];
      const author = parts[1];
      const message = parts[2];

      if (
        parts.length !== 3 ||
        sha === undefined ||
        author === undefined ||
        message === undefined
      ) {
        throw new Error("Unexpected output from git log");
      }

      return {
        sha,
        author,
        message,
        url: `https://github.com/${repository}/commit/${sha}`,
      };
    });
}

export async function collectChangedFiles(
  currentTag: string,
  previousTag: string | null,
): Promise<ChangedFile[]> {
  if (previousTag === null) {
    const { stdout } = await execFileAsync(
      "git",
      ["ls-tree", "-r", "--name-only", "-z", currentTag],
      { encoding: "utf8" },
    );

    return stdout
      .split("\0")
      .filter((path) => path.length > 0)
      .map((path) => ({ path, status: CHANGED_FILE_STATUS.ADDED }));
  }

  const { stdout } = await execFileAsync(
    "git",
    ["diff", "--name-status", "--find-renames", "-z", previousTag, currentTag],
    { encoding: "utf8" },
  );

  const fields = stdout.split("\0").filter((field) => field.length > 0);
  const files: ChangedFile[] = [];

  for (let index = 0; index < fields.length; ) {
    const status = fields[index];

    if (status === undefined) {
      throw new Error("Unexpected output from git diff");
    }

    if (status.startsWith("R")) {
      const previousPath = fields[index + 1];
      const path = fields[index + 2];

      if (previousPath === undefined || path === undefined) {
        throw new Error("Incomplete rename record from git diff");
      }

      files.push({ path, previousPath, status: CHANGED_FILE_STATUS.RENAMED });
      index += 3;
      continue;
    }

    const path = fields[index + 1];

    if (path === undefined) {
      throw new Error("Missing file path in git diff output");
    }

    let fileStatus: ChangedFileStatus;

    switch (status) {
      case "A":
        fileStatus = CHANGED_FILE_STATUS.ADDED;
        break;
      case "M":
      case "T":
        fileStatus = CHANGED_FILE_STATUS.MODIFIED;
        break;
      case "D":
        fileStatus = CHANGED_FILE_STATUS.DELETED;
        break;
      default:
        throw new Error(`Unsupported file status from git diff: ${status}`);
    }

    files.push({ path, status: fileStatus });
    index += 2;
  }

  return files;
}
