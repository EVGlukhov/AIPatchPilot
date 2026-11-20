# PatchPilot

PatchPilot is a TypeScript project for analyzing software changes and preparing AI-assisted development workflows. Its current feature is a release report generator.

> **Project status:** The release report workflow is implemented in this repository. PatchPilot is not currently published as an npm package or as a reusable GitHub Action.

## Release reports

When a version tag matching `vMAJOR.MINOR.PATCH` is pushed, GitHub Actions runs the release report workflow. For example, `v1.2.3` triggers it; tags such as `1.2.3` do not.

The workflow:

1. Checks out `main` and the full Git history.
2. Runs the TypeScript type check and tests.
3. Collects commits and changed files between the current tag and the previous reachable version tag. For the first release, it uses the history and files available at that tag.
4. Finds merged pull requests associated with those commits.
5. Generates an AI summary from the collected facts.
6. Writes a Markdown report to `docs/releases/<tag>.md` and pushes it to `main`.

The generated AI summary is instructed to use only the collected facts. The summarizer runs without tools enabled.

## Requirements

- Node.js 22
- npm
- Git
- A checkout containing the release tag and its Git history
- A GitHub token for reading repository and pull request data
- A GitHub Copilot token accepted by the Copilot SDK for generating the AI summary

Keep tokens private. Do not commit them to the repository.

## Run locally

Install dependencies:

```bash
npm ci
```

Set the required environment variables in your shell:

```bash
export GITHUB_TOKEN="your-github-token"
export COPILOT_GITHUB_TOKEN="your-copilot-token"
```

Then run the report generator with an existing tag and the repository in `owner/repo` format:

```bash
npm run release:report -- v1.2.3 owner/repo
```

The report is written to `docs/releases/v1.2.3.md`. The command must run in a Git checkout where the specified tag and the history needed for comparison are available.

## GitHub Actions setup

The workflow for this repository is at `.github/workflows/release-report.yml`. To enable it:

1. Add the workflow to the repository's default branch.
2. In **Settings → Secrets and variables → Actions**, create a repository secret named `COPILOT_GITHUB_TOKEN`.
3. Push a version tag, for example:

   ```bash
   git tag v1.2.3
   git push origin v1.2.3
   ```

GitHub provides the workflow's `GITHUB_TOKEN`; the workflow grants it `contents: write` and `pull-requests: read`. The separate `COPILOT_GITHUB_TOKEN` secret is used for the AI summary.

The workflow commits reports directly to `main`. Repository rules must permit that push; otherwise the commit step will fail and the branch protection settings need to be adjusted.

## Development checks

Run the tests and type check with:

```bash
npm test
npm run typecheck
```
