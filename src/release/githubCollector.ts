import type { CommitRecord, PullRequestRecord } from "./types.js";

const pageSize = 100;

export async function collectPullRequests(
  commits: CommitRecord[],
  repository: string,
  token: string,
): Promise<PullRequestRecord[]> {
  if (token.trim().length === 0) {
    throw new Error("Github token is required");
  }

  const [owner, repo, extra] = repository.split("/");
  if (!owner || !repo || extra !== undefined) {
    throw new Error(`Invalid repository name: ${repository}`);
  }

  const pullsByNumber = new Map<number, PullRequestRecord>();

  for (const commit of commits) {
    for (let page = 1; ; page += 1) {
      const url = new URL(
        `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/commits/${encodeURIComponent(commit.sha)}/pulls`,
      );
      url.searchParams.set("per_page", String(pageSize));
      url.searchParams.set("page", String(page));

      const response = await fetch(url, {
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${token}`,
          "X-GitHub-Api-Version": "2026-03-10",
        },
      });

      if (!response.ok) {
        throw new Error(
          `GitHub API request failed for commit ${commit.sha}: HTTP ${response.status}`,
        );
      }

      const payload: unknown = await response.json();
      if (!Array.isArray(payload)) {
        throw new Error("Unexpected response from GitHub API");
      }

      for (const item of payload) {
        const pullRequest = parsePullRequest(item);
        if (pullRequest !== null) {
          pullsByNumber.set(pullRequest.number, pullRequest);
        }
      }

      if (payload.length < pageSize) {
        break;
      }
    }
  }

  return [...pullsByNumber.values()].sort(
    (a, b) => a.mergedAt.localeCompare(b.mergedAt) || a.number - b.number,
  );
}

function parsePullRequest(value: unknown): PullRequestRecord | null {
  if (!isRecord(value)) {
    throw new Error("Unexpected pull request data from GitHub API");
  }

  const number = value.number;
  const title = value.title;
  const url = value.html_url;
  const mergedAt = value.merged_at;
  const user = value.user;

  if (
    typeof number !== "number" ||
    !Number.isInteger(number) ||
    typeof title !== "string" ||
    typeof url !== "string" ||
    (mergedAt !== null && typeof mergedAt !== "string")
  ) {
    throw new Error("Invalid pull request data from GitHub API");
  }

  let author: string | null;
  if (user === null) {
    author = null;
  } else if (isRecord(user) && typeof user.login === "string") {
    author = user.login;
  } else {
    throw new Error("Invalid pull request author from GitHub API");
  }

  if (mergedAt === null) {
    return null;
  }

  return { number, title, author, url, mergedAt };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
