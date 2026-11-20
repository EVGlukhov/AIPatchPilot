import {
  collectChangedFiles,
  collectCommits,
  findPreviousReleaseTag,
} from "./gitCollector.js";
import { collectPullRequests } from "./githubCollector.js";
import type { ReleaseReportData } from "./types.js";

export async function collectReleaseData(
  currentTag: string,
  repository: string,
  token: string,
): Promise<ReleaseReportData> {
  const previousTag = await findPreviousReleaseTag(currentTag);

  const [commits, files] = await Promise.all([
    collectCommits(currentTag, previousTag, repository),
    collectChangedFiles(currentTag, previousTag),
  ]);

  const pullRequests = await collectPullRequests(commits, repository, token);

  return {
    repository,
    currentTag,
    previousTag,
    commits,
    pullRequests,
    files,
  };
}
