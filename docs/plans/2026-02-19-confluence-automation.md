# Confluence Doc Automation Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Automatically sync a changelog and technical reference to Confluence on every merge to `main` using GitHub Actions + Claude API.

**Architecture:** A GitHub Actions workflow triggers on push to `main`, runs a TypeScript script that extracts codebase info (routes, schema, components) and git diff, calls Claude API to generate human-readable docs, then pushes them to Confluence via REST API. Doc failures are non-blocking — they log a warning but never fail the merge.

**Tech Stack:** GitHub Actions, TypeScript, ts-node, Anthropic SDK (`@anthropic-ai/sdk`), Confluence REST API v2, Node.js `fs`/`child_process`

---

### Task 1: Add GitHub Secrets

**Files:**

- No code files — GitHub UI only

**Step 1: Add secrets in GitHub**

Go to your repo → Settings → Secrets and variables → Actions → New repository secret.
Add each of these:

```
CONFLUENCE_BASE_URL     = https://yoursite.atlassian.net
CONFLUENCE_EMAIL        = your@email.com
CONFLUENCE_API_TOKEN    = <your token>
CONFLUENCE_SPACE_KEY    = <your space key>
ANTHROPIC_API_KEY       = <your Anthropic key>
```

**Step 2: Verify**

Go to Settings → Secrets and variables → Actions and confirm all 5 secrets are listed.

---

### Task 2: Install Script Dependencies

**Files:**

- Modify: `package.json`

**Step 1: Install Anthropic SDK and ts-node**

```bash
npm install @anthropic-ai/sdk
npm install --save-dev ts-node
```

**Step 2: Add sync-docs script to package.json**

In `package.json` `"scripts"` section, add:

```json
"docs:sync": "ts-node scripts/sync-docs/index.ts"
```

**Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add anthropic sdk and ts-node for docs automation"
```

---

### Task 3: Create `diff.ts` — Extract git diff and commit messages

**Files:**

- Create: `scripts/sync-docs/diff.ts`

**Step 1: Create the file**

```typescript
import { execSync } from "child_process";

export function getGitDiff(): string {
  try {
    // Get the diff of the last merge commit vs its first parent
    const diff = execSync("git diff HEAD~1 HEAD --stat", { encoding: "utf-8" });
    return diff;
  } catch {
    return "Could not retrieve git diff.";
  }
}

export function getCommitMessages(): string {
  try {
    const log = execSync('git log HEAD~1..HEAD --pretty=format:"%s"', { encoding: "utf-8" });
    return log;
  } catch {
    return "Could not retrieve commit messages.";
  }
}
```

**Step 2: Verify it runs without error**

```bash
npx ts-node -e "import { getGitDiff, getCommitMessages } from './scripts/sync-docs/diff'; console.log(getCommitMessages());"
```

Expected: prints the last commit message.

**Step 3: Commit**

```bash
git add scripts/sync-docs/diff.ts
git commit -m "feat(docs): add git diff extractor"
```

---

### Task 4: Create `extract.ts` — Parse routes, schema, components

**Files:**

- Create: `scripts/sync-docs/extract.ts`

**Step 1: Create the file**

```typescript
import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

function findFiles(dir: string, pattern: RegExp): string[] {
  const results: string[] = [];
  if (!fs.existsSync(dir)) return results;

  function walk(current: string) {
    const entries = fs.readdirSync(current, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory() && entry.name !== "node_modules") {
        walk(fullPath);
      } else if (entry.isFile() && pattern.test(entry.name)) {
        results.push(fullPath);
      }
    }
  }

  walk(dir);
  return results;
}

export function extractApiRoutes(): string {
  const routeFiles = findFiles("src/app/api", /route\.ts$/);
  if (routeFiles.length === 0) return "No API routes found.";

  return routeFiles
    .map((file) => {
      const content = fs.readFileSync(file, "utf-8");
      const methods = ["GET", "POST", "PUT", "PATCH", "DELETE"].filter(
        (m) =>
          content.includes(`export async function ${m}`) ||
          content.includes(`export function ${m}`),
      );
      const route = file.replace("src/app", "").replace("/route.ts", "");
      return `${route} [${methods.join(", ")}]`;
    })
    .join("\n");
}

export function extractSchema(): string {
  const migrationFiles = findFiles("supabase/migrations", /\.sql$/);
  if (migrationFiles.length === 0) return "No migrations found.";

  return migrationFiles
    .map((file) => {
      const content = fs.readFileSync(file, "utf-8");
      const tables = [...content.matchAll(/CREATE TABLE (?:IF NOT EXISTS )?(\w+)/gi)].map(
        (m) => m[1],
      );
      return tables.length > 0 ? `${path.basename(file)}: tables [${tables.join(", ")}]` : null;
    })
    .filter(Boolean)
    .join("\n");
}

export function extractComponents(): string {
  const componentFiles = findFiles("src/components", /\.tsx$/);
  if (componentFiles.length === 0) return "No components found.";

  return componentFiles
    .map((file) => {
      const name = path.basename(file, ".tsx");
      const rel = file.replace("src/components/", "");
      return `${name} (${rel})`;
    })
    .join("\n");
}

export function extractPages(): string {
  const pageFiles = findFiles("src/app", /page\.tsx$/);
  if (pageFiles.length === 0) return "No pages found.";

  return pageFiles
    .map((file) => {
      return file.replace("src/app", "").replace("/page.tsx", "") || "/";
    })
    .join("\n");
}
```

**Step 2: Verify it runs**

```bash
npx ts-node -e "
import { extractApiRoutes, extractSchema, extractComponents, extractPages } from './scripts/sync-docs/extract';
console.log('Routes:', extractApiRoutes());
console.log('Schema:', extractSchema());
"
```

Expected: prints your API routes and table names.

**Step 3: Commit**

```bash
git add scripts/sync-docs/extract.ts
git commit -m "feat(docs): add codebase extractor for routes, schema, components"
```

---

### Task 5: Create `generate.ts` — Call Claude API to write docs

**Files:**

- Create: `scripts/sync-docs/generate.ts`

**Step 1: Create the file**

```typescript
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function generateChangelog(params: {
  commitMessages: string;
  diff: string;
  date: string;
}): Promise<string> {
  const message = await client.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `You are a technical writer. Write a concise changelog entry for the following git changes.

Date: ${params.date}
Commit messages: ${params.commitMessages}
Files changed:
${params.diff}

Write a short changelog entry (3-8 bullet points) summarizing what changed and why. Use plain language. Format as HTML list items (<ul><li>...</li></ul>) suitable for Confluence.`,
      },
    ],
  });

  const block = message.content[0];
  return block.type === "text" ? block.text : "";
}

export async function generateTechnicalReference(params: {
  routes: string;
  schema: string;
  components: string;
  pages: string;
}): Promise<string> {
  const message = await client.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 2048,
    messages: [
      {
        role: "user",
        content: `You are a technical writer. Generate a technical reference document for a Next.js event management app called EventTara.

API Routes:
${params.routes}

Database Tables (from migrations):
${params.schema}

App Pages:
${params.pages}

Components:
${params.components}

Write a structured technical reference in HTML suitable for Confluence. Include sections: API Routes, Database Schema, Pages, Components. Keep descriptions concise.`,
      },
    ],
  });

  const block = message.content[0];
  return block.type === "text" ? block.text : "";
}
```

**Step 2: Verify (requires ANTHROPIC_API_KEY set locally)**

```bash
ANTHROPIC_API_KEY=your_key npx ts-node -e "
import { generateChangelog } from './scripts/sync-docs/generate';
generateChangelog({ commitMessages: 'feat: test', diff: 'src/app/page.tsx', date: '2026-02-19' }).then(console.log);
"
```

Expected: prints a short HTML changelog entry.

**Step 3: Commit**

```bash
git add scripts/sync-docs/generate.ts
git commit -m "feat(docs): add Claude API doc generator"
```

---

### Task 6: Create `confluence.ts` — Push pages to Confluence

**Files:**

- Create: `scripts/sync-docs/confluence.ts`

**Step 1: Create the file**

```typescript
const BASE_URL = process.env.CONFLUENCE_BASE_URL!;
const EMAIL = process.env.CONFLUENCE_EMAIL!;
const TOKEN = process.env.CONFLUENCE_API_TOKEN!;
const SPACE_KEY = process.env.CONFLUENCE_SPACE_KEY!;

const authHeader = "Basic " + Buffer.from(`${EMAIL}:${TOKEN}`).toString("base64");

async function fetchJSON(url: string, options: RequestInit = {}) {
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: authHeader,
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Confluence API error ${res.status}: ${text}`);
  }
  return res.json();
}

async function findPage(title: string): Promise<{ id: string; version: number } | null> {
  const encoded = encodeURIComponent(title);
  const data = await fetchJSON(
    `${BASE_URL}/wiki/rest/api/content?spaceKey=${SPACE_KEY}&title=${encoded}&expand=version`,
  );
  if (data.results.length === 0) return null;
  return { id: data.results[0].id, version: data.results[0].version.number };
}

async function createPage(title: string, body: string): Promise<void> {
  await fetchJSON(`${BASE_URL}/wiki/rest/api/content`, {
    method: "POST",
    body: JSON.stringify({
      type: "page",
      title,
      space: { key: SPACE_KEY },
      body: { storage: { value: body, representation: "storage" } },
    }),
  });
  console.log(`Created page: ${title}`);
}

async function updatePage(id: string, version: number, title: string, body: string): Promise<void> {
  await fetchJSON(`${BASE_URL}/wiki/rest/api/content/${id}`, {
    method: "PUT",
    body: JSON.stringify({
      type: "page",
      title,
      version: { number: version + 1 },
      body: { storage: { value: body, representation: "storage" } },
    }),
  });
  console.log(`Updated page: ${title}`);
}

export async function appendChangelog(newEntry: string, date: string): Promise<void> {
  const title = "Changelog";
  const existing = await findPage(title);

  const entryHtml = `<h2>${date}</h2>${newEntry}<hr/>`;

  if (!existing) {
    await createPage(title, entryHtml);
  } else {
    // Get current body and prepend new entry
    const data = await fetchJSON(
      `${BASE_URL}/wiki/rest/api/content/${existing.id}?expand=body.storage`,
    );
    const currentBody = data.body.storage.value;
    await updatePage(existing.id, existing.version, title, entryHtml + currentBody);
  }
}

export async function overwriteTechnicalReference(body: string): Promise<void> {
  const title = "Technical Reference";
  const existing = await findPage(title);

  if (!existing) {
    await createPage(title, body);
  } else {
    await updatePage(existing.id, existing.version, title, body);
  }
}
```

**Step 2: Commit**

```bash
git add scripts/sync-docs/confluence.ts
git commit -m "feat(docs): add Confluence REST API client"
```

---

### Task 7: Create `index.ts` — Orchestrate the pipeline

**Files:**

- Create: `scripts/sync-docs/index.ts`

**Step 1: Create the file**

```typescript
import { getGitDiff, getCommitMessages } from "./diff";
import { extractApiRoutes, extractSchema, extractComponents, extractPages } from "./extract";
import { generateChangelog, generateTechnicalReference } from "./generate";
import { appendChangelog, overwriteTechnicalReference } from "./confluence";

async function main() {
  const date = new Date().toISOString().split("T")[0];
  console.log(`[docs-sync] Starting doc sync for ${date}`);

  const diff = getGitDiff();
  const commitMessages = getCommitMessages();
  const routes = extractApiRoutes();
  const schema = extractSchema();
  const components = extractComponents();
  const pages = extractPages();

  console.log("[docs-sync] Generating changelog via Claude API...");
  const changelog = await generateChangelog({ commitMessages, diff, date });

  console.log("[docs-sync] Generating technical reference via Claude API...");
  const techRef = await generateTechnicalReference({ routes, schema, components, pages });

  console.log("[docs-sync] Pushing changelog to Confluence...");
  await appendChangelog(changelog, date);

  console.log("[docs-sync] Pushing technical reference to Confluence...");
  await overwriteTechnicalReference(techRef);

  console.log("[docs-sync] Done.");
}

main().catch((err) => {
  console.error("[docs-sync] Error:", err.message);
  process.exit(1);
});
```

**Step 2: Commit**

```bash
git add scripts/sync-docs/index.ts
git commit -m "feat(docs): add sync-docs orchestrator"
```

---

### Task 8: Create GitHub Actions Workflow

**Files:**

- Create: `.github/workflows/sync-docs.yml`

**Step 1: Create the workflow**

```yaml
name: Sync Docs to Confluence

on:
  push:
    branches:
      - main

jobs:
  sync-docs:
    runs-on: ubuntu-latest
    continue-on-error: true # doc failures never block the merge

    steps:
      - name: Checkout repo
        uses: actions/checkout@v4
        with:
          fetch-depth: 2 # need HEAD~1 for diff

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Run doc sync
        run: npm run docs:sync
        env:
          CONFLUENCE_BASE_URL: ${{ secrets.CONFLUENCE_BASE_URL }}
          CONFLUENCE_EMAIL: ${{ secrets.CONFLUENCE_EMAIL }}
          CONFLUENCE_API_TOKEN: ${{ secrets.CONFLUENCE_API_TOKEN }}
          CONFLUENCE_SPACE_KEY: ${{ secrets.CONFLUENCE_SPACE_KEY }}
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
```

**Step 2: Commit and push**

```bash
git add .github/workflows/sync-docs.yml
git commit -m "feat(docs): add GitHub Actions workflow for Confluence sync"
git push origin main
```

**Step 3: Verify**

Go to your GitHub repo → Actions tab. You should see the "Sync Docs to Confluence" workflow running. Check its logs for `[docs-sync] Done.`

After it completes, open your Confluence space and confirm:

- A **Changelog** page exists with an entry
- A **Technical Reference** page exists with routes, schema, and components

---

## Summary

| Task | Output                                                        |
| ---- | ------------------------------------------------------------- |
| 1    | GitHub Secrets configured                                     |
| 2    | Dependencies installed, npm script added                      |
| 3    | `scripts/sync-docs/diff.ts`                                   |
| 4    | `scripts/sync-docs/extract.ts`                                |
| 5    | `scripts/sync-docs/generate.ts`                               |
| 6    | `scripts/sync-docs/confluence.ts`                             |
| 7    | `scripts/sync-docs/index.ts`                                  |
| 8    | `.github/workflows/sync-docs.yml` + push to trigger first run |
