---
layout: post
unique_id: LLMMCP01
title: MCP server basics - Building an MCP server for reminders
subtitle: sss.
tldr: Create an MCP server to handle reminders to understand how data flows between the MCP client and the server
permalink: /blog/llm/mcp/mcp-server-basics
author: srungta
tags:
  - LLM
  - MCP Server

series:
  id: LLM
  index: 1
---
* TOC
{:toc}

## Introduction to MCP Servers

MCP (Model Control Protocol) servers are designed to bridge the gap between AI models and external tools or services. They serve a similar purpose to what API endpoints have been doing for decades. MCP servers expose a set of "tools" (APIs) that the AI can call to perform actions, fetch data, or automate workflows. This enables AI assistants to interact with your apps, databases, or devices in a secure and structured way.

## What We Are Building

In this post, we'll build a simple MCP server that manages reminders. The server will expose a tool to add reminders, which can then be invoked by an AI assistant or inspected manually. This example will help you understand how to structure your server, handle inputs, and ensure a smooth experience for both users and AI models.

## MCP Server: Add Reminder Tool (TypeScript SDK)

Let's start with a minimal MCP server exposing an `add_reminder` tool. We'll use TypeScript and the official MCP SDK for this example.

First, install the MCP SDK:

```bash
npm install @mcp/sdk
```

Now, create your MCP server:

```typescript
import { MCPServer, Tool, ToolContext, z } from "@mcp/sdk";

const reminders: { text: string; time: string }[] = [];

const addReminderTool = new Tool({
  name: "add_reminder",
  description: "Add a new reminder",
  inputSchema: z.object({
    text: z.string(),
    time: z.string().describe("ISO 8601 format"),
  }),
  async execute(input, ctx: ToolContext) {
    reminders.push({ text: input.text, time: input.time });
    return { status: "success", reminder: input };
  },
});

const server = new MCPServer({
  tools: [addReminderTool],
});

server.listen(8000, () => {
  console.log("MCP server running on http://localhost:8000");
});
```

This endpoint accepts a reminder text and time, then stores it in memory.

## Testing with Inspector

You can test your MCP server using the [MCP Inspector](https://inspector.mcp.ai/):

1. Start your server: `node dist/index.js`
2. Open Inspector and connect to `http://localhost:8000`
3. Try calling the `add_reminder` tool with sample inputs:

```json
{
  "text": "Doctor appointment",
  "time": "2025-06-10T15:00:00Z"
}
```

Inspector will show the request and response, helping you debug and iterate quickly.

## Testing with Claude Desktop

To test with Claude Desktop:

1. Add your MCP server as a custom tool.
2. Ask Claude:  
   _"Remind me to call mom at 7pm tonight."_
3. Claude will call your `add_reminder` tool with the parsed details.

This workflow demonstrates how AI can use your server to automate reminders.

## Best Practices for Tool Inputs

### 1. Use Structured Inputs

Define clear, typed input schemas for each tool. Avoid free-form text when possible.

**Example:**

```typescript
inputSchema: z.object({
  text: z.string(),
  time: z.string().describe("ISO 8601"),
})
```

### 2. Validate and Normalize Inputs

Ensure your server validates and normalizes inputs. For example, parse and check date/time formats.

```typescript
import { DateTime } from "luxon";

const addReminderTool = new Tool({
  name: "add_reminder",
  description: "Add a new reminder",
  inputSchema: z.object({
    text: z.string(),
    time: z.string(),
  }),
  async execute(input, ctx) {
    const dt = DateTime.fromISO(input.time);
    if (!dt.isValid) {
      return { status: "error", message: "Invalid time format" };
    }
    reminders.push({ text: input.text, time: input.time });
    return { status: "success", reminder: input };
  },
});
```

### 3. Progressive Enhancement: Example Scenarios

Let's see how input handling can evolve:

#### Scenario 1: Minimal Input

```json
{
  "text": "Meeting",
  "time": "2025-06-10T09:00:00Z"
}
```
Works, but doesn't handle ambiguity or missing fields.

#### Scenario 2: Flexible Input

Allow optional fields, but clarify defaults.

```typescript
inputSchema: z.object({
  text: z.string(),
  time: z.string().optional(), // If not provided, ask the user
})
```

#### Scenario 3: User-Friendly Prompts

If the time is missing or ambiguous, return a prompt for clarification:

```typescript
async execute(input, ctx) {
  if (!input.time) {
    return { status: "need_more_info", message: "What time should I set the reminder for?" };
  }
  // ...rest of logic
}
```

This approach ensures the AI can ask follow-up questions, leading to a better user experience.

## Conclusion

Building an MCP server is straightforward, but designing robust tools requires attention to input structure, validation, and user experience. By following these best practices and testing with Inspector and Claude Desktop, you can create powerful integrations that make your AI assistant truly helpful.