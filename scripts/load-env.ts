/**
 * Shared environment loader for seed scripts.
 *
 * - Default: uses @next/env loadEnvConfig (reads .env.local)
 * - --staging flag: manually reads .env.staging.local (since @next/env ignores NODE_ENV=staging)
 */

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { loadEnvConfig } from "@next/env";

export function loadEnvironment(projectRoot: string): void {
  if (process.argv.includes("--staging")) {
    const envFile = resolve(projectRoot, ".env.staging.local");

    if (!existsSync(envFile)) {
      console.error(
        "ERROR: .env.staging.local not found.\n" +
          "Copy .env.staging.local.example to .env.staging.local and fill in your staging credentials.",
      );
      process.exit(1);
    }

    const content = readFileSync(envFile, "utf-8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIndex = trimmed.indexOf("=");
      if (eqIndex === -1) continue;
      const key = trimmed.slice(0, eqIndex);
      const value = trimmed.slice(eqIndex + 1);
      process.env[key] = value;
    }

    console.log("Loaded environment from .env.staging.local");
  } else {
    loadEnvConfig(projectRoot);
  }
}
