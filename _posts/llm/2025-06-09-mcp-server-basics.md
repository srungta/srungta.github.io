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

- TOC
  {:toc}

## Introduction to MCP Servers

MCP (Model Control Protocol) servers are designed to bridge the gap between AI models and external tools or services. They serve a similar purpose to what API endpoints have been doing for decades. MCP servers expose a set of "tools" (APIs) that the AI can call to perform actions, fetch data, or automate workflows. This enables AI assistants to interact with your apps, databases, or devices in a secure and structured way.

## What We Are Building

In this post, we'll build a simple MCP server that manages reminders. The server will expose a tool to add reminders, which can then be invoked by an AI assistant or inspected manually. This example will help you understand how to structure your server, handle inputs, and ensure a smooth experience for both users and AI models.

## Lets start building

We will start with simple typescript server and progressively add stuff. We wont really be saving the reminder but mostly focus on interactions between MCP clients and the server. We will build a minimal MCP server exposing an `add-reminder` tool. We'll use TypeScript and the official MCP SDK for this example. We follow the documentation at https://modelcontextprotocol.io/quickstart/server#node to get started.

**Our scenario :** `Add a reminder to catch the bus daily at 5PM.`

### Setup the project

Install node on your system from https://nodejs.org first so that you can run the TS code locally. Anything above NOde 16 should be okay.
Check if you have node by running this in your terminal.

```
node --version
npm --version
```

Lets initialize the project

```
# Create a new directory for our project
mkdir reminders
cd reminders

# Initialize a new npm project
npm init -y

# Install dependencies
npm install @modelcontextprotocol/sdk
npm install zod
npm install -D @types/node
npm install -D typescript
```

1. `@modelcontextprotocol/sdk` is the official MCP SDK - https://github.com/modelcontextprotocol/typescript-sdk
2. `zod` is a typescript validation library. Not essential but eases development - https://zod.dev/
3. `@types/node` for getting types for common node models.
4. `typescript` because type check is a boon.

Update your package.json to add `type: "module"` and a build script:

```
{
  "type": "module",
  "bin": {
    "reminders": "./build/index.js"
  },
  "scripts": {
    "build": "tsc"
  },
  "files": ["build"]
}
```

Create a `tsconfig.json` in the root:

```
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "Node16",
    "moduleResolution": "Node16",
    "outDir": "./build",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules"]
}
```

### Add a basic server that does not do anything.

Lets start with a basic server that exposes the metadata about the server first.

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

// Create server instance
const server = new McpServer({
  name: "reminders",
  version: "1.0.0",
  capabilities: {
    resources: {},
    tools: {},
  },
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Reminder server running on stdio.");
}

main().catch((error) => {
  console.error(`Fatal error in main():`, error);
  process.exit(1);
});
```

1. `name: "reminders",` declares a server of the name "reminders". This is the name that shows up on your clients like Claude. So choose wisely.
2. `const transport = new StdioServerTransport();` creates a stdio based server transport which essentially means you can start receiving messages on stdin and sending messages on stdout. This is essentially how local MCP servers talk to clients.

### Test with inspector.

### Test with claude desktop.

### Add functionality to add a reminder from text

Let's add a tool to the server so that we can add the `add-reminder` skill to our server.

```typescript
const server = new McpServer({...});
...
server.tool(
  "add-reminder",
  "Add a reminder for the user",
  {
    reminderText: z.string().describe("Free form text containing the content of the reminder"))
  },
  async (
    { reminderText },
    ctx) =>
    {
      // TODO : Actully save the reminder text to some external system.
      let response = [
        `Request ID : ${ctx.requestId}`,
        `Your reminder is set.`,
        `Reminder Content: "${reminderText}"`
      ]
      return {
          content: [
              { type: "text",text: response.join("\n") }
          ]
      }
    });
...
async function main() {...}
```

1. Here we add a tool called `add-reminder`. Make sure to use a good description of what the tool does so that the MCP client can have help text and it can choose your tool better. In our case, writing a simple text like `Add a reminder...` works because it is the only one that is installed, but in real world, users will have multiple servers installed. Having a good description will ensure users are able to trigger your tool consistently.
2. `reminderText` is a argument that we expose. `z.string()` does a validation check that the value passed to reminderText is actually a string. It throws a runtime error otherwise. The description of the argument is also important as it is used by client to understand what value to pass.
3. The callback function is where the actual processing happens. The `ctx` object has additional metadata sent by the client. This has the information that we had seen in the inspector like `ctx.requestId`.
4. The return value has to be in a structure format. Since `content` is an array, you can send multiple content types like image, video etc. as part of single response. Here we only send `text`.

### Add a reminder from text with date and time

### Add a reminder to capture recurring intent

### Handling recurrance and non-recurrance correctly.

### Follow ups with multiple calls to server.

## Testing with Inspector

You can test your MCP server using the [MCP Inspector](https://inspector.mcp.ai/):

1. Start your server: `node dist/index.js`
2. Open Inspector and connect to `http://localhost:8000`
3. Try calling the `add-reminder` tool with sample inputs:

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
3. Claude will call your `add-reminder` tool with the parsed details.

This workflow demonstrates how AI can use your server to automate reminders.

## Best Practices for Tool Inputs

### 1. Use Structured Inputs

Define clear, typed input schemas for each tool. Avoid free-form text when possible.

**Example:**

```typescript
inputSchema: z.object({
  text: z.string(),
  time: z.string().describe("ISO 8601"),
});
```

### 2. Validate and Normalize Inputs

Ensure your server validates and normalizes inputs. For example, parse and check date/time formats.

```typescript
import { DateTime } from "luxon";

const addReminderTool = new Tool({
  name: "add-reminder",
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
});
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
