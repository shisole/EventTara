import { ChatAnthropic } from "@langchain/anthropic";
import { type BaseCheckpointSaver } from "@langchain/langgraph";
import { createReactAgent } from "@langchain/langgraph/prebuilt";

import { buildCocoSystemPrompt } from "./system-prompt";
import { createAllTools } from "./tools";
import { type AgentContext } from "./types";

interface CreateCocoAgentOptions {
  ctx: AgentContext;
  checkpointer?: BaseCheckpointSaver;
}

/**
 * Creates a Coco ReAct agent with tools bound to the given auth context.
 * Agent is created per-request (tools need per-request Supabase client).
 * Checkpointer is shared across requests for multi-turn memory.
 */
export function createCocoAgent({ ctx, checkpointer }: CreateCocoAgentOptions) {
  const model = new ChatAnthropic({
    model: "claude-haiku-4-5-20251001",
    temperature: 0,
    maxTokens: 1024,
    anthropicApiKey: process.env.ANTHROPIC_CHAT_API_KEY,
  });

  const tools = createAllTools(ctx);
  const systemPrompt = buildCocoSystemPrompt(ctx);

  return createReactAgent({
    llm: model,
    tools,
    prompt: systemPrompt,
    checkpointer,
  });
}
