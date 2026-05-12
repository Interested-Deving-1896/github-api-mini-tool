# GitHub API Mini Tool

A tiny runnable command-line tool that calls the GitHub REST API and prints a short open-issue summary for a repository.

This repository is intentionally small. It is meant to demonstrate a real GitHub API integration that can be developed further.

## Requirements

- Node.js 18 or newer
- Optional: `GITHUB_TOKEN` for a higher API rate limit

## Usage

```bash
npm start -- cli/cli --limit 3
```

Or run the file directly:

```bash
node ./src/index.js owner/repo --limit 5
```

Example with a token:

```bash
GITHUB_TOKEN=ghp_your_token_here node ./src/index.js cli/cli --limit 3
```

## What It Does

- Parses a repository in `owner/repo` form.
- Calls `GET /repos/{owner}/{repo}/issues`.
- Filters out pull requests from the issue list.
- Prints issue numbers, titles, authors, and URLs.
- Prints GitHub API rate-limit information when available.

## Developer Program Note

This is a minimal GitHub API integration in development. It can be extended into a dashboard, automation, or notification tool.
