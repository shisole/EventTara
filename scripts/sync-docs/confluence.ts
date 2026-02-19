function requireEnv(name: string): string {
  const val = process.env[name];
  if (!val) throw new Error(`Missing required environment variable: ${name}`);
  return val;
}

const BASE_URL = requireEnv('CONFLUENCE_BASE_URL');
const EMAIL = requireEnv('CONFLUENCE_EMAIL');
const TOKEN = requireEnv('CONFLUENCE_API_TOKEN');
const SPACE_KEY = requireEnv('CONFLUENCE_SPACE_KEY');

const authHeader = 'Basic ' + Buffer.from(`${EMAIL}:${TOKEN}`).toString('base64');

interface ConfluencePage {
  id: string;
  version: { number: number };
  body?: { storage: { value: string } };
}

interface ConfluenceSearchResult {
  results: ConfluencePage[];
}

async function fetchJSON<T>(url: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Authorization': authHeader,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Confluence API error ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

async function findPage(title: string): Promise<{ id: string; version: number } | null> {
  const encoded = encodeURIComponent(title);
  const data = await fetchJSON<ConfluenceSearchResult>(
    `${BASE_URL}/wiki/rest/api/content?spaceKey=${SPACE_KEY}&title=${encoded}&expand=version`
  );
  if (data.results.length === 0) return null;
  return { id: data.results[0].id, version: data.results[0].version.number };
}

async function createPage(title: string, body: string): Promise<void> {
  await fetchJSON<ConfluencePage>(`${BASE_URL}/wiki/rest/api/content`, {
    method: 'POST',
    body: JSON.stringify({
      type: 'page',
      title,
      space: { key: SPACE_KEY },
      body: { storage: { value: body, representation: 'storage' } },
    }),
  });
  console.log(`Created page: ${title}`);
}

async function updatePage(id: string, version: number, title: string, body: string): Promise<void> {
  await fetchJSON<ConfluencePage>(`${BASE_URL}/wiki/rest/api/content/${id}`, {
    method: 'PUT',
    body: JSON.stringify({
      type: 'page',
      title,
      version: { number: version + 1 },
      body: { storage: { value: body, representation: 'storage' } },
    }),
  });
  console.log(`Updated page: ${title}`);
}

export async function appendChangelog(newEntry: string, date: string): Promise<void> {
  const title = 'Changelog';
  const existing = await findPage(title);

  const entryHtml = `<h2>${date}</h2>${newEntry}<hr/>`;

  if (!existing) {
    await createPage(title, entryHtml);
  } else {
    const data = await fetchJSON<ConfluencePage>(
      `${BASE_URL}/wiki/rest/api/content/${existing.id}?expand=body.storage`
    );
    const currentBody = data.body?.storage.value ?? '';
    await updatePage(existing.id, existing.version, title, entryHtml + currentBody);
  }
}

export async function overwriteTechnicalReference(body: string): Promise<void> {
  const title = 'Technical Reference';
  const existing = await findPage(title);

  if (!existing) {
    await createPage(title, body);
  } else {
    await updatePage(existing.id, existing.version, title, body);
  }
}
