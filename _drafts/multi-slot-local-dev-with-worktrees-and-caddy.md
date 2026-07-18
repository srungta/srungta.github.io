---
layout: post
unique_id: LLMSLOT01
title: "Run Multiple App Copies Locally with Git Worktrees and Caddy"
subtitle: Give every worktree a stable URL and isolated database without duplicating heavy infrastructure.
tldr: Run one frontend and API per worktree, route stable local hostnames through Caddy, and isolate data with one Cosmos database per slot.
permalink: /blog/llm/multi-slot-local-dev-with-worktrees-and-caddy
author: srungta
tags:
  - LLM
  - Git
  - Local Development
  - Caddy

series:
  id: LLM
  index: 4

isNew: true
---

> **Companion post:** [Git Worktrees for Agentic Development](/blog/llm/git-worktrees-for-agentic-development)
> explains why worktrees are useful when people or coding agents work on several branches at once.

A normal local setup has one frontend, one API, and one database. It works until you try to run a
second branch at the same time.

Both copies want the same ports. Both write to the same local database. The frontend in each branch
needs to know where its API is running. Soon you are editing environment files and keeping port
numbers in your head.

This post replaces that bookkeeping with **dev slots**. A slot is one running copy of the app for one
git worktree.

Each slot gets:

- A stable frontend URL such as `http://feature-search.myapp.localhost:8088`.
- A stable API URL such as `http://api-feature-search.myapp.localhost:8088`.
- Its own frontend and API ports behind those URLs.
- Its own Cosmos DB database, such as `myapp-feature-search`.

All slots share one Caddy proxy and one Cosmos DB emulator.

## Try the complete sample

The working sample is in
[`code-samples/LLMWT02`](https://github.com/srungta/srungta.github.io/tree/main/code-samples/LLMWT02).
It contains a React frontend, a .NET API, Docker Compose infrastructure, and the slot script used in
this post.

You need:

- Docker Desktop or Docker Engine with Compose
- .NET 10 SDK
- Node.js 22 or newer
- Bash and `curl` (macOS, Linux, or WSL)

From the sample directory, run:

```bash
./tools/dev-slot.sh infra-up
./tools/dev-slot.sh up
```

The first command starts the shared Cosmos DB emulator and Caddy. The second command:

1. Gets the slot name from your current git branch.
2. Assigns stable frontend and API ports.
3. Creates a database name for the slot.
4. Starts the API and frontend.
5. Adds both hostnames to Caddy.

On the `main` branch, it prints:

```text
Slot 'main' is ready.
  Frontend: http://main.myapp.localhost:8088
  API:      http://api-main.myapp.localhost:8088
  Database: myapp-main
```

Open the frontend URL and add a note. That note is stored only in this slot's database.

If you are not in a git branch, or want a specific name, pass one:

```bash
./tools/dev-slot.sh up demo
```

That is the entire daily startup flow.

## Run a second branch

Create a worktree from your main clone:

```bash
git worktree add ../myapp-feature-search -b feature/search
```

Enter that worktree and start its slot:

```bash
cd ../myapp-feature-search/code-samples/LLMWT02
./tools/dev-slot.sh up
```

Now both copies run at the same time:

| Branch | Frontend | Database |
| --- | --- | --- |
| `main` | `http://main.myapp.localhost:8088` | `myapp-main` |
| `feature/search` | `http://feature-search.myapp.localhost:8088` | `myapp-feature-search` |

Adding a note in one frontend does not make it appear in the other.

## The simple mental model

```text
Browser
  |
  | http://<slot>.myapp.localhost:8088
  v
Caddy (shared)
  |
  +-- main frontend ------------ localhost:4xxxx
  +-- main API ----------------- localhost:2xxxx ---- myapp-main
  +-- feature-search frontend -- localhost:4yyyy
  +-- feature-search API ------- localhost:2yyyy ---- myapp-feature-search
                                                        |
                                                        v
                                             Cosmos emulator (shared)
```

There are only two kinds of resources:

**Shared, start once:**

- Caddy listens on port `8088` and routes requests by hostname.
- The Cosmos DB emulator listens on port `8081` and hosts many databases.

**Per slot, start for each worktree:**

- One Vite dev server.
- One .NET API process.
- One Cosmos database name.

## Why the URLs work

Names ending in `.localhost` resolve to the loopback address in modern browsers. You do not need to
add every slot to `/etc/hosts`.

Caddy receives all traffic on port `8088`. It uses the request hostname to choose an upstream:

```caddyfile
http://feature-search.myapp.localhost:8088 {
	reverse_proxy host.docker.internal:40123
}

http://api-feature-search.myapp.localhost:8088 {
	reverse_proxy host.docker.internal:20123
}
```

The actual port numbers do not matter to the person using the app. Caddy hides them behind readable,
predictable URLs.

The Caddy container reaches host-run processes through `host.docker.internal`. The Compose file adds
a host-gateway mapping so the same setup works with Docker Engine on Linux as well as Docker Desktop.

## Why the data stays isolated

Running one Cosmos emulator per worktree would use unnecessary memory. Instead, every API connects
to the same endpoint but uses a different database name:

```bash
Cosmos__Endpoint="https://localhost:8081"
Cosmos__Database="myapp-feature-search"
```

.NET maps the double underscore in `Cosmos__Database` to the configuration key
`Cosmos:Database`.

The sample API uses the current Linux-based Cosmos DB emulator image in HTTPS mode:

```yaml
cosmos:
  image: mcr.microsoft.com/cosmosdb/linux/azure-cosmos-emulator:vnext-latest
  command: ["--protocol", "https"]
  ports:
    - "8080:8080" # readiness endpoint
    - "8081:8081" # Cosmos endpoint
    - "1234:1234" # Data Explorer
```

The vNext emulator supports the API for NoSQL in gateway mode, so the .NET client sets it explicitly:

```csharp
var cosmos = new CosmosClient(endpoint, key, new CosmosClientOptions
{
    ConnectionMode = ConnectionMode.Gateway,
    ServerCertificateCustomValidationCallback = (_, _, _) => true,
});
```

The certificate bypass is for the local emulator only. Do not use it with a production Cosmos DB
account.

## What the slot script records

Each slot has a small state directory under `~/.config/myapp/slots`:

```text
~/.config/myapp/slots/feature-search/
├── env
├── Caddyfile
├── api.pid
├── api.log
├── frontend.pid
└── frontend.log
```

The script derives a stable numeric offset from the sanitized slot name. It uses that offset for the
frontend and API ports, then checks known slots for a collision before starting anything.

The generated frontend environment file points to the API through Caddy:

```ini
VITE_API_BASE=http://api-feature-search.myapp.localhost:8088
```

Vite listens on all host interfaces so Caddy's container can reach it. It also allows the local slot
hostnames:

```ts
export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: ['.myapp.localhost'],
  },
})
```

You do not need to copy the full orchestration script from this article. Use the tested
[`tools/dev-slot.sh`](https://github.com/srungta/srungta.github.io/blob/main/code-samples/LLMWT02/tools/dev-slot.sh)
from the sample.

## Stop and inspect slots

List all known slots:

```bash
./tools/dev-slot.sh status
```

Stop only the current branch's slot:

```bash
./tools/dev-slot.sh down
```

Stop a named slot:

```bash
./tools/dev-slot.sh down feature-search
```

When no slots remain, stop shared infrastructure:

```bash
./tools/dev-slot.sh infra-down
```

The script refuses to stop shared infrastructure while known slots still exist. Normal shutdown also
preserves the Cosmos Docker volume, so your local data survives a restart.

## The pattern to reuse

You can adapt the sample to another project by changing four things:

1. Replace `myapp.localhost` with your local domain.
2. Replace the commands that start the frontend and API.
3. Pass a slot-specific database, schema, or tenant name to your backend.
4. Keep shared services in the infrastructure Compose file and lightweight app processes per slot.

The important idea is not the exact script. It is the separation of concerns:

- Git worktrees isolate files and branches.
- Caddy gives changing processes stable names.
- Per-slot database names isolate data.
- Shared infrastructure keeps the setup light enough to run many copies.

With those boundaries in place, running another branch becomes one command instead of another round
of port and configuration bookkeeping.
