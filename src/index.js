#!/usr/bin/env node

const GITHUB_API_VERSION = "2022-11-28";
const DEFAULT_LIMIT = 5;

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    printHelp();
    return;
  }

  const repo = args.repo ?? "cli/cli";
  const [owner, name] = parseRepository(repo);
  const limit = parseLimit(args.limit);

  const issues = await fetchOpenIssues({ owner, name, limit });
  printIssueSummary({ owner, name, issues, limit });
}

function parseArgs(argv) {
  const args = {
    help: false,
    limit: DEFAULT_LIMIT,
    repo: undefined,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];

    if (value === "-h" || value === "--help") {
      args.help = true;
      continue;
    }

    if (value === "--limit") {
      args.limit = argv[index + 1];
      index += 1;
      continue;
    }

    if (value.startsWith("--limit=")) {
      args.limit = value.slice("--limit=".length);
      continue;
    }

    if (!args.repo) {
      args.repo = value;
      continue;
    }

    throw new Error(`Unexpected argument: ${value}`);
  }

  return args;
}

function parseRepository(repo) {
  const parts = repo.split("/");

  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    throw new Error(`Repository must use owner/repo format, got: ${repo}`);
  }

  return parts;
}

function parseLimit(value) {
  const limit = Number.parseInt(String(value), 10);

  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    throw new Error("--limit must be an integer from 1 to 100");
  }

  return limit;
}

async function fetchOpenIssues({ owner, name, limit }) {
  const url = new URL(`https://api.github.com/repos/${owner}/${name}/issues`);
  url.searchParams.set("state", "open");
  url.searchParams.set("per_page", String(limit));

  const headers = {
    Accept: "application/vnd.github+json",
    "User-Agent": "github-api-mini-tool",
    "X-GitHub-Api-Version": GITHUB_API_VERSION,
  };

  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  const response = await fetch(url, { headers });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`GitHub API request failed: ${response.status} ${response.statusText}\n${body}`);
  }

  const issues = await response.json();
  const remaining = response.headers.get("x-ratelimit-remaining");
  const reset = response.headers.get("x-ratelimit-reset");

  return {
    items: issues.filter((issue) => !issue.pull_request),
    rateLimit: {
      remaining,
      resetAt: reset ? new Date(Number(reset) * 1000).toISOString() : undefined,
    },
  };
}

function printIssueSummary({ owner, name, issues, limit }) {
  console.log(`Open issues for ${owner}/${name} (up to ${limit}):`);

  if (issues.items.length === 0) {
    console.log("No open issues found in the first page of API results.");
  }

  for (const issue of issues.items) {
    console.log(`#${issue.number}: ${issue.title}`);
    console.log(`  author: ${issue.user?.login ?? "unknown"}`);
    console.log(`  url: ${issue.html_url}`);
  }

  if (issues.rateLimit.remaining) {
    console.log(`API requests remaining: ${issues.rateLimit.remaining}`);
  }

  if (issues.rateLimit.resetAt) {
    console.log(`Rate limit resets at: ${issues.rateLimit.resetAt}`);
  }
}

function printHelp() {
  console.log(`GitHub API Mini Tool

Usage:
  node ./src/index.js owner/repo --limit 5

Options:
  --limit <number>  Number of open issues to request, 1-100. Default: ${DEFAULT_LIMIT}
  -h, --help        Show this help message.

Environment:
  GITHUB_TOKEN      Optional GitHub token for a higher API rate limit.`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
