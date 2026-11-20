import { generateReleaseSummary } from "./aiSummary.js";
import type { ReleaseReportData } from "./types.js";

const sample: ReleaseReportData = {
  repository: "EVGlukhov/PatchPilot",
  currentTag: "v0.1.0",
  previousTag: null,
  pullRequests: [
    {
      number: 42,
      title: "Add search",
      author: "alice",
      url: "https://github.com/EVGlukhov/PatchPilot/pull/42",
      mergedAt: "2026-11-20T12:00:00Z",
    },
  ],
  commits: [
    {
      sha: "abcdef123456789",
      message: "Add search",
      author: "Alice",
      url: "https://github.com/EVGlukhov/PatchPilot/commit/abcdef123456789",
    },
  ],
  files: [{ path: "src/search.ts", status: "added" }],
};

async function main(): Promise<void> {
  const summary = await generateReleaseSummary(sample);
  console.log(summary);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Unknown error");
  process.exitCode = 1;
});
