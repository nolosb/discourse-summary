#!/usr/bin/env node

import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { loadConfig } from "./config.js";
import { createClient } from "./discourse.js";
import { createLlmClient } from "./llm.js";
import { parsePeriod } from "./period.js";
import * as userScope from "./scopes/user.js";
import * as topicScope from "./scopes/topic.js";
import * as queryScope from "./scopes/query.js";
import * as groupScope from "./scopes/group.js";

const config = loadConfig();
const discourse = createClient(config);
const llm = createLlmClient(config);

const scopes = {
  user: userScope,
  topic: topicScope,
  query: queryScope,
  group: groupScope,
};

const server = new McpServer({
  name: "discourse-summary",
  version: "0.1.0",
});

server.tool(
  "discourse_summary",
  "Fetch Discourse data and return a structured summary via a self-hosted LLM. " +
    "Scope determines what to summarize: a user's activity, a topic thread, " +
    "a search query, or an entire group's activity. " +
    "Claude receives only the condensed summary, not raw posts. " +
    "Always render the full summary output to the user — do not summarize or paraphrase it.",
  {
    scope: z
      .enum(["user", "topic", "query", "group"])
      .describe(
        "What to summarize. user: a user's activity. topic: a thread. query: search results. group: all members of a group.",
      ),
    target: z
      .string()
      .describe(
        "The target to summarize. Username for user scope, topic ID for topic scope, search term for query scope, group name for group scope.",
      ),
    period: z
      .string()
      .optional()
      .describe(
        'Time period. Examples: "1 week", "6 months", "2025-01-01 to 2025-06-01". Default: 6 months. Ignored for topic scope.',
      ),
    prompt: z
      .string()
      .optional()
      .describe(
        "Optional custom system prompt. Overrides the default analysis prompt for the scope. Use to control the style and focus of the summary.",
      ),
  },
  async ({ scope, target, period, prompt }) => {
    const { since, until } = parsePeriod(period);
    const scopeHandler = scopes[scope];

    const log = (message) =>
      server.sendLoggingMessage({ level: "info", data: message });

    await log(`Fetching ${scope} data for "${target}"…`);

    const { systemPrompt, userMessage, maxTokens, meta } =
      await scopeHandler.gather(discourse, { target, since, until });

    await log("Sending to LLM for analysis…");

    const analysis = await llm.complete(prompt || systemPrompt, userMessage, {
      maxTokens,
    });

    const metaLine = meta?.postCount != null
      ? `\n\n---\n_${meta.postCount} posts analyzed._`
      : "";

    return {
      content: [
        {
          type: "text",
          text: analysis + metaLine,
          annotations: { audience: ["user", "assistant"] },
        },
      ],
    };
  },
);

const transport = new StdioServerTransport();
await server.connect(transport);
