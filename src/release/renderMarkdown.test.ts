import test from "node:test";
import { CHANGED_FILE_STATUS, type ReleaseReportData } from "./types.js";
import { renderReleaseReport } from "./renderMarkdown.js";
import assert from "node:assert/strict";

const sample: ReleaseReportData = {
  repository: "octo/project",
  currentTag: "v1.2.3",
  previousTag: "v1.2.2",
  pullRequests: [
    {
      number: 42,
      title: "Add search",
      author: "alice",
      url: "https://github.com/octo/project/pull/42",
      mergedAt: "2026-11-19T12:00:00Z",
    },
  ],
  commits: [
    {
      sha: "abcdef123456789",
      message: "Add search",
      author: "Alice",
      url: "https://github.com/octo/project/commit/abcdef123456789",
    },
  ],
  files: [
    {
      path: "src/new",
      previousPath: "src/old",
      status: CHANGED_FILE_STATUS.RENAMED,
    },
  ],
};

test("renders release details and links", () => {
  const markdown = renderReleaseReport(sample, "Adds search functionality.");

  assert.ok(markdown.includes("# Release v1\\.2\\.3"));
  assert.ok(markdown.includes("Changes from v1\\.2\\.2 to v1\\.2\\.3"));
  assert.ok(
    markdown.includes(
      "[\\#42: Add search](<https://github.com/octo/project/pull/42>)",
    ),
  );
  assert.ok(markdown.includes("Adds search functionality\\."));
  assert.ok(
    markdown.includes(
      "[abcdef1](<https://github.com/octo/project/commit/abcdef123456789>)",
    ),
  );
  assert.ok(markdown.includes("src/old => src/new (renamed)"));
});

test("shows first-release and empty-list messages", () => {
  const markdown = renderReleaseReport(
    {
      ...sample,
      previousTag: null,
      pullRequests: [],
      commits: [],
      files: [],
    },
    "Adds search functionality.",
  );

  assert.ok(markdown.includes("Initial release (no previous tag)"));
  assert.ok(markdown.includes("No merged pull requests found."));
  assert.ok(markdown.includes("No commits found."));
  assert.ok(markdown.includes("No changed files found."));
});

test("rejects links outside github.com", () => {
  assert.throws(
    () =>
      renderReleaseReport(
        {
          ...sample,
          pullRequests: [
            {
              ...sample.pullRequests[0]!,
              url: "https://example.com/pull/42",
            },
          ],
        },
        "Adds search functionality.",
      ),
    /Expected a GitHub HTTPS URL/,
  );
});

test("rejects renamed files without their old path", () => {
  assert.throws(
    () =>
      renderReleaseReport(
        {
          ...sample,
          files: [{ path: "src/new", status: CHANGED_FILE_STATUS.RENAMED }],
        },
        "Adds search functionality.",
      ),
    /missing previousPath/,
  );
});
