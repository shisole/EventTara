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
  console.error("[docs-sync] Error:", err);
  process.exit(1);
});
