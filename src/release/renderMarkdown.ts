import { CHANGED_FILE_STATUS, type ReleaseReportData } from "./types.js";

export function renderReleaseReport(
  data: ReleaseReportData,
  summary: string,
): string {
  const comparison =
    data.previousTag === null
      ? "Initial release (no previous tag)"
      : `Changes from ${escapeMarkdown(data.previousTag)} to ${escapeMarkdown(data.currentTag)}`;

  const pullRequestLines =
    data.pullRequests.length === 0
      ? ["- No merged pull requests found."]
      : data.pullRequests.map((pullRequest) => {
          const label = `#${pullRequest.number}: ${pullRequest.title}`;
          const author =
            pullRequest.author === null
              ? "unknown author"
              : `@${pullRequest.author}`;

          return `- ${githubLink(label, pullRequest.url)} - ${escapeMarkdown(author)} - merged ${escapeMarkdown(pullRequest.mergedAt)}`;
        });

  const commitLines =
    data.commits.length === 0
      ? ["- No commits found."]
      : data.commits.map(
          (commit) =>
            `- ${githubLink(commit.sha.slice(0, 7), commit.url)} ${escapeMarkdown(commit.message)} - ${escapeMarkdown(commit.author)}`,
        );

  const fileLines =
    data.files.length === 0
      ? ["- No changed files found."]
      : data.files.map((file) => {
          if (file.status === CHANGED_FILE_STATUS.RENAMED) {
            if (file.previousPath === undefined) {
              throw new Error(
                `Renamed file is missing previousPath: ${file.path}`,
              );
            }

            return `- ${escapeMarkdown(file.previousPath)} => ${escapeMarkdown(file.path)} (renamed)`;
          }

          return `- ${escapeMarkdown(file.path)} (${file.status})`;
        });

  return [
    `# Release ${escapeMarkdown(data.currentTag)}`,
    "",
    `Repository: ${escapeMarkdown(data.repository)}`,
    `Comparison: ${comparison}`,
    "",
    "## Summary",
    escapeMarkdown(summary),
    "",
    "## Pull requests",
    ...pullRequestLines,
    "",
    "## Commits",
    ...commitLines,
    "",
    "## Changed files",
    ...fileLines,
    "",
  ].join("\n");
}

function githubLink(label: string, value: string): string {
  const url = new URL(value);

  if (url.protocol !== "https:" || url.hostname !== "github.com") {
    throw new Error(`Expected a GitHub HTTPS URL: ${value}`);
  }

  return `[${escapeMarkdown(label)}](<${url.href}>)`;
}

function escapeMarkdown(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replace(/[\r\n]+/g, " ")
    .replace(/[\\`*_{}\[\]\{\}#.!|~+-]/g, "\\$&");
}
