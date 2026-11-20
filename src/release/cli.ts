import { join } from "node:path";
import { collectReleaseData } from "./collectReleaseData.js";
import { renderReleaseReport } from "./renderMarkdown.js";
import { mkdir, writeFile } from "node:fs/promises";
import { generateReleaseSummary } from "./aiSummary.js";

async function main(): Promise<void> {
  const currentTag = process.argv[2];
  const repository = process.argv[3];

  if (!currentTag) {
    throw new Error("Usage: npm run release:report -- <tag> <owner/repo>");
  }

  if (!repository) {
    throw new Error("Usage: npm run release:report -- <tag> <owner/repo>");
  }

  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    throw new Error("GITHUB_TOKEN environment variable is required");
  }

  const data = await collectReleaseData(currentTag, repository, token);
  const summary = await generateReleaseSummary(data);
  const report = renderReleaseReport(data, summary);

  const outputDirectory = join("docs", "releases");
  await mkdir(outputDirectory, { recursive: true });

  const outputPath = join(outputDirectory, `${currentTag}.md`);
  await writeFile(outputPath, report, "utf8");

  console.log(`Wrote release report: ${outputPath}`);
}

main().catch((error: unknown) => {
  const message =
    error instanceof Error ? error.message : "Unknown release report error";
  console.error(message);
  process.exitCode = 1;
});
