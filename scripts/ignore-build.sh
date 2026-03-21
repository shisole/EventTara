#!/bin/bash
# Vercel ignore build step — skip deploy if no relevant files changed.
# Exits 0 = skip build, exits 1 = proceed with build.

if [ -z "$VERCEL_GIT_PREVIOUS_SHA" ]; then
  exit 1
fi

# After force-pushes, the previous SHA may not exist
if ! git cat-file -t "$VERCEL_GIT_PREVIOUS_SHA" >/dev/null 2>&1; then
  exit 1
fi

git diff --quiet "$VERCEL_GIT_PREVIOUS_SHA" HEAD -- \
  src/ e2e/ public/ next.config.mjs package.json \
  pnpm-lock.yaml tailwind.config.ts tsconfig.json vercel.json
