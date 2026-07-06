---
title: "Anatomy of a Coding Agent: Building One From Scratch"
description: "An agent is a loop, an LLM, and tool calling. Everything else is harness."
date: 2026-07-05
draft: false
lang: en
tags: ["ai-agents", "llm", "developer-tools", "typescript", "coding-agent"]
series: "coding-agent"
order: 1
---
Earlier, I built an internal RAG-powered bot that drafts answers to new Telegram tickets based on similar past ones, so the team stops repeating itself.

I got curious about coding agents. Not retrieval — something that reads files, runs commands, and decides what to do next on its own.

I did some research — read a few articles, dug through the docs, watched a couple of videos. I was surprised how small the idea is. An agent = LLM + loop + JSON.

This is Part 1 of me building one. No original ideas. Honest ones.

## The trick

An LLM takes text as input and returns text as output. That's great for chat, but it can't perform real actions on its own.

Imagine it could call functions in your code. It could check the weather, fetch exchange rates, read emails, or look up ticket prices.

The challenge is simple: how does the model tell your code which function to call and what arguments to use?

A naive solution is to ask the model to output something like:

```
ACTION: get_weather(Bishkek)
```

Your code parses the text and runs the function.

But this is fragile. If the model adds extra words or changes the format, the parser can fail.

The better approach is to give the model a list of available functions, each with a name, description, and a JSON schema for its arguments.

```json
{
  "name": "get_exchange_rate",
  "description": "Get the current exchange rate between two currencies.",
  "parameters": {
    "type": "object",
    "properties": {
      "from": { "type": "string" },
      "to": { "type": "string" }
    },
    "required": ["from", "to"]
  }
}
```

If the model wants to use this function, it returns a matching JSON object:

```json
{
  "name": "get_exchange_rate",
  "arguments": {
    "from": "USD",
    "to": "KGS"
  }
}
```

Your code reads the JSON, calls the function, and feeds the result back to the model.

That's [tool calling](https://platform.openai.com/docs/guides/function-calling).  A pre-agreed JSON protocol with two sides:

- **You define** the available functions.
- **The model chooses** one or more and provides its arguments as JSON.
- **Your code executes** it and returns the result.

Wrap this in a loop, and you have an agent. Something like:

```typescript

// Tool declarations the model sees.
const TOOLS = [
  {
    type: 'function' as const,
    function: {
      name: 'get_exchange_rate',
      description: 'Get the current exchange rate between two currencies.',
      parameters: {
        type: 'object',
        properties: { from: { type: 'string' }, to: { type: 'string' } },
        required: ['from', 'to'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'get_weather',
      description: 'Get the current weather for a city.',
      parameters: {
        type: 'object',
        properties: { city: { type: 'string' } },
        required: ['city'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'get_ticket_price',
      description: 'Get the cheapest ticket price for a route between two cities.',
      parameters: {
        type: 'object',
        properties: { from: { type: 'string' }, to: { type: 'string' } },
        required: ['from', 'to'],
      },
    },
  },
] as const;

type ToolName = typeof TOOLS[number]['function']['name'];
// "get_exchange_rate" | "get_weather" | "get_ticket_price"
// Handler registry — key must match a tool's name.
const HANDLERS: Record<ToolName, (args: any) => Promise<string>> = {
  get_exchange_rate: async ({ from, to }) => getExchangeRateApi(from, to),
  get_weather: async ({ city }) => getWeatherApi(city),
  get_ticket_price: async ({ from, to }) => getTicketPriceApi(from, to),
};

const messages: ChatCompletionMessageParam[] = [
  { role: 'system', content: 'You are an assistant. Use the tools when needed.' },
  { role: 'user', content: "What's today's USD to KGS rate?" },
];

while (true) {
  const msg = await openApi.create({ model: 'gpt-4o-mini', messages, tools: TOOLS });

  if (!msg.tool_calls?.length) { console.log(msg.content); break; }

  messages.push(msg);
  for (const call of msg.tool_calls) {

    const handler = HANDLERS[call.function.name];
    if (!handler) throw new Error(`No handler for ${call.function.name}`);

    const args = JSON.parse(call.function.arguments);
    const result = await handler(args);

    messages.push({ role: 'tool', tool_call_id: call.id, content: result });
  }
}
```

## A coding agent

Now you know the three pillars. A coding agent is the same idea, just a different harness.

The pillars stay: LLM, loop, tool calling. What changes is (a) we have one tool — `bash` — and (b) we wrap the loop so future parts (permissions, streaming, memory) can hook into it without rewriting anything.

Here's the actual engine from the repo:

```typescript
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import { MAX_TURNS } from './constants.ts';
import { runBash } from './tools.ts';
import { callLLM } from './llm.ts';
import type { AgentEvent } from './types.ts';

export async function* agentLoop(
  messages: ChatCompletionMessageParam[],
): AsyncGenerator<AgentEvent, void, void> {
  let turn = 0;
  while (turn < MAX_TURNS) {
    turn++;
    yield { type: 'turn_started', turn };
    const { content, toolCalls } = await callLLM(messages);

    if (content) yield { type: 'assistant_message', content };
    if (toolCalls.length === 0) {
      yield { type: 'done' };
      return;
    }

    messages.push({
      role: 'assistant',
      content: content || null,
      tool_calls: toolCalls,
    });

    for (const tc of toolCalls) {
      if (tc.type !== 'function') continue;
      const args = JSON.parse(tc.function.arguments) as Record<string, unknown>;
      yield { type: 'tool_call', toolCallId: tc.id, name: tc.function.name, args };
      const command = typeof args.command === 'string' ? args.command : '';
      const result = await runBash(command);
      yield { type: 'tool_result', toolCallId: tc.id, result };
      messages.push({ role: 'tool', tool_call_id: tc.id, content: result });
    }
  }
  yield { type: 'max_turns_reached', maxTurns: MAX_TURNS };
}
```

**Why a generator?** For hooks — small files that listen to what the loop does and react. Right now, one prints progress. In Part 3, a permissions hook will pause the loop before a `bash` command and ask you first. In Part 4, a streaming hook will paint the answer as it arrives. The engine stays; the hooks grow.

Run it:

```
node agent.ts "count the lines of TypeScript in this repo, excluding node_modules"
```

Full v1 — REPL, env validation, hooks — lives at [github.com/sadraliev/aida](https://github.com/sadraliev/aida/tree/v1), tag `v1`.

See you in Part 2.
