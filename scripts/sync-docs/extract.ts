import * as fs from 'fs';
import * as path from 'path';

function findFiles(dir: string, pattern: RegExp): string[] {
  const results: string[] = [];
  if (!fs.existsSync(dir)) return results;

  function walk(current: string) {
    const entries = fs.readdirSync(current, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory() && entry.name !== 'node_modules') {
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
  const routeFiles = findFiles('src/app/api', /route\.ts$/);
  if (routeFiles.length === 0) return 'No API routes found.';

  return routeFiles.map(file => {
    const content = fs.readFileSync(file, 'utf-8');
    const methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].filter(m =>
      content.includes(`export async function ${m}`) || content.includes(`export function ${m}`)
    );
    const route = file.replace('src/app', '').replace('/route.ts', '');
    return `${route} [${methods.join(', ')}]`;
  }).join('\n');
}

export function extractSchema(): string {
  const migrationFiles = findFiles('supabase/migrations', /\.sql$/);
  if (migrationFiles.length === 0) return 'No migrations found.';

  return migrationFiles.map(file => {
    const content = fs.readFileSync(file, 'utf-8');
    const tables = [...content.matchAll(/CREATE TABLE (?:IF NOT EXISTS )?(\w+)/gi)]
      .map(m => m[1]);
    return tables.length > 0 ? `${path.basename(file)}: tables [${tables.join(', ')}]` : null;
  }).filter(Boolean).join('\n');
}

export function extractComponents(): string {
  const componentFiles = findFiles('src/components', /\.tsx$/);
  if (componentFiles.length === 0) return 'No components found.';

  return componentFiles.map(file => {
    const name = path.basename(file, '.tsx');
    const rel = file.replace('src/components/', '');
    return `${name} (${rel})`;
  }).join('\n');
}

export function extractPages(): string {
  const pageFiles = findFiles('src/app', /page\.tsx$/);
  if (pageFiles.length === 0) return 'No pages found.';

  return pageFiles.map(file => {
    return file.replace('src/app', '').replace('/page.tsx', '') || '/';
  }).join('\n');
}
