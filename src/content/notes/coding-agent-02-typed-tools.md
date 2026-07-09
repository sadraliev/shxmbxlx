---
title: "Anatomy of an Agent's Toolkit"
description: "Every agent has its own toolkit. Each tool does one job, with validated inputs and shaped outputs."
date: 2026-07-07
draft: false
lang: en
tags: ["ai-agents", "llm", "developer-tools", "typescript", "coding-agent"]
series: "coding-agent"
order: 2
---

In [Part 1](/notes/coding-agent-01-bare-loop), my agent had one tool: bash. But bash is really a gateway to hundreds of commands, each with different behaviors and side effects. Give an LLM access to that gateway, and it may execute commands you never intended.

Narrow tools work differently. Instead of giving the model an unrestricted shell, you give it a small set of allowed actions. Each tool has defined inputs we can validate and predictable outputs we can control. Bash gives us neither.

In this version, every tool has three parts: a description the model can read, a schema that validates its arguments, and a handler that does the actual work.

Here's the simplest tool.

```typescript
const SENSITIVE_FILES = new Set([
  '.env',
  '.env.local',
  '.env.production',
]);

read_file: {
  description: 'Read the contents of a text file.',
  schema: z.object({
    path: z.string().describe('File path to read.'),
  }),
  handler: async ({ path }) => {
    const filename = basename(path);

    if (SENSITIVE_FILES.has(filename)) {
      return `Refusing to read sensitive file: ${filename}.`;
    }

    return readFile(path, 'utf8');
  },
},
```
`read_file` returns raw file contents.

## What the model shouldn't know

The model only sees the `description` and `schema`.

Everything else stays inside the handler.

That includes API keys, bearer tokens, database credentials, internal services, and private user data.

```typescript
send_email: {
  description: 'Send an email.',
  schema: z.object({
    to: z.string(),
    subject: z.string(),
    body: z.string(),
  }),
  handler: async ({ to, subject, body }) => {
    await smtp.send({
      to,
      subject,
      text: body,
      auth: process.env.SMTP_TOKEN,
    });

    return 'sent';
  },
},
```

The model asks for:

```json
{
  "name": "send_email",
  "arguments": {
    "to": "alice@example.com",
    "subject": "Hello",
    "body": "Hi!"
  }
}
```

It never sees where the SMTP token comes from, how the connection is established, or which library actually sends the email.

The handler is your implementation. The model only gets the interface.

## The lifecycle of a tool call

A single tool definition drives the entire lifecycle.

```text
Tool definition
        │
        ├──────────────► OpenAI API
        │                    │
        │                    ▼
        │              JSON Schema
        │                    │
        ▼                    ▼
    Dispatcher ◄────────── Tool Call
        │
        ▼
   Validation
        │
        ▼
     Handler
        │
        ▼
      Result
        │
        ▼
  Conversation
```

The journey starts with the same object we defined earlier.

From it, we generate the function definition sent to the OpenAI API.

```typescript
export const TOOLS: ChatCompletionTool[] = Object.entries(tools).map(
  ([name, def]) => ({
    type: 'function',
    function: {
      name,
      description: def.description,
      parameters: zodToJsonSchema(def.schema, {
        target: 'openApi3',
      }) as Record<string, unknown>,
    },
  }),
);
```

The TypeScript object becomes JSON Schema.

The model never sees your source code. It only receives something like this.

```json
{
  "type": "function",
  "function": {
    "name": "read_file",
    "description": "Read the contents of a text file.",
    "parameters": {
      "type": "object",
      "properties": {
        "path": {
          "type": "string"
        }
      },
      "required": ["path"]
    }
  }
}
```

Later, when the model decides to use the tool, it responds with another JSON object.

```json
{
  "name": "read_file",
  "arguments": {
    "path": "README.md"
  }
}
```

That request reaches the dispatcher.

```typescript
export async function dispatch(
  name: string,
  args: unknown,
): Promise<DispatchOutcome> {
  const tool = tools[name];

  if (!tool)
    return {
      ok: false,
      error: `unknown tool '${name}'`,
    };

  const parsed = tool.schema.safeParse(args);

  if (!parsed.success) {
    return {
      ok: false,
      error: `invalid args: ${parsed.error.message}`,
    };
  }

  try {
    const result = await tool.handler(parsed.data);

    return {
      ok: true,
      result,
    };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}
```

The dispatcher performs three checks.

1. Does the tool exist?
2. Do the arguments match the schema?
3. Did the handler succeed?

If validation fails, the handler never runs.

For example, this is valid:

```json
{
  "path": "README.md"
}
```

This isn't:

```json
{
  "paths": ["README.md"]
}
```

The schema expects `path`, not `paths`, so the dispatcher rejects the request before touching the file system.

If validation succeeds, the handler receives arguments that already match the expected types.

## Wrapping up

A tool isn't just a function.

It's a contract between the model and your application.

The model gets a small, predictable interface with validated inputs and shaped outputs.

Your application keeps everything else: implementation, secrets, side effects, and control.

Compared to giving an LLM unrestricted access to a shell, narrow tools dramatically reduce the surface area for mistakes while making the system easier to reason about.

Full v2—typed tools, Zod validation, and token stats—lives at [github.com/sadraliev/aida](https://github.com/sadraliev/aida/tree/v2), tag `v2`.