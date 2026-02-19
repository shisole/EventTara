import Anthropic from '@anthropic-ai/sdk';

const MODEL = 'claude-sonnet-4-5-20250929';

const apiKey = process.env.ANTHROPIC_API_KEY;
if (!apiKey) throw new Error('Missing required environment variable: ANTHROPIC_API_KEY');
const client = new Anthropic({ apiKey });

export async function generateChangelog(params: {
  commitMessages: string;
  diff: string;
  date: string;
}): Promise<string> {
  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: `You are a technical writer. Write a concise changelog entry for the following git changes.

Date: ${params.date}
Commit messages: ${params.commitMessages}
Files changed:
${params.diff}

Write a short changelog entry (3-8 bullet points) summarizing what changed and why. Use plain language. Format as HTML list items (<ul><li>...</li></ul>) suitable for Confluence.`
    }]
  });

  const block = message.content[0];
  return block.type === 'text' ? block.text : '';
}

export async function generateTechnicalReference(params: {
  routes: string;
  schema: string;
  components: string;
  pages: string;
}): Promise<string> {
  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 2048,
    messages: [{
      role: 'user',
      content: `You are a technical writer. Generate a technical reference document for a Next.js event management app called EventTara.

API Routes:
${params.routes}

Database Tables (from migrations):
${params.schema}

App Pages:
${params.pages}

Components:
${params.components}

Write a structured technical reference in HTML suitable for Confluence. Include sections: API Routes, Database Schema, Pages, Components. Keep descriptions concise.`
    }]
  });

  const block = message.content[0];
  return block.type === 'text' ? block.text : '';
}
