# Confluence Doc Automation Design

**Date:** 2026-02-19
**Status:** Approved

## Overview

Automatically sync documentation to Confluence on every merge to `main`. Uses GitHub Actions to extract codebase structure, generate human-readable docs via Claude API, and push to Confluence via REST API.

## Architecture

```
merge to main
    └── GitHub Actions workflow (.github/workflows/sync-docs.yml)
            ├── 1. Checkout repo + get git diff
            ├── 2. Parse source files (routes, schema, components)
            ├── 3. Call Claude API → generate changelog entry
            ├── 4. Call Claude API → generate/update technical reference
            └── 5. Push pages to Confluence via REST API
                    ├── "Changelog" page (append new entry)
                    └── "Technical Reference" page (overwrite with latest)
```

### Confluence Page Structure

```
EventTara Space
├── Changelog          ← appended on every merge
└── Technical Reference
        ├── API Routes
        ├── Database Schema
        └── Components
```

## Data Extraction

The script scans these paths:

| Source | Confluence Output |
|--------|------------------|
| `src/app/api/**/route.ts` | API Routes (method, path, description) |
| `supabase/migrations/*.sql` | Database Schema (tables, columns, types) |
| `src/app/**/page.tsx` | App pages/routes |
| `src/components/**/*.tsx` | Component inventory (name, props) |
| `git diff` + commit messages | Changelog narrative context |

Claude API generates:
1. **Changelog entry** — human-readable summary of what changed and why (appended)
2. **Technical reference** — structured docs for routes, schema, components (full overwrite)

## Script Structure

```
.github/
└── workflows/
    └── sync-docs.yml          ← triggers on push to main

scripts/
└── sync-docs/
    ├── index.ts               ← entry point, orchestrates the pipeline
    ├── extract.ts             ← parses routes, schema, components from src/
    ├── diff.ts                ← gets git diff + commit messages
    ├── generate.ts            ← calls Claude API to write docs
    └── confluence.ts          ← pushes pages to Confluence REST API
```

## Error Handling

- Claude API failure → log error, skip doc update, **merge is not blocked**
- Confluence API failure → log error, skip doc update, **merge is not blocked**
- GitHub Actions shows a warning badge on failure for visibility
- Workflow can be manually re-run from GitHub Actions UI without a new commit

## GitHub Secrets Required

```
CONFLUENCE_BASE_URL
CONFLUENCE_EMAIL
CONFLUENCE_API_TOKEN
CONFLUENCE_SPACE_KEY
ANTHROPIC_API_KEY
```
