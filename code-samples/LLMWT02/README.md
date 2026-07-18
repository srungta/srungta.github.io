# Worktree dev slots sample

This is the runnable companion sample for the blog post **Running Many Copies of Your App at Once: Git Worktrees + Caddy**. Each git worktree gets its own frontend, API, URL, ports, and Cosmos DB database while sharing one Caddy proxy and one Cosmos DB emulator.

## Prerequisites

- Docker Desktop or Docker Engine with Compose
- .NET 10 SDK
- Node.js 22 or newer
- Bash and curl (macOS, Linux, or WSL)

## Run it

From this directory:

```bash
./tools/dev-slot.sh infra-up
./tools/dev-slot.sh up
```

The second command derives the slot name from the current branch, installs frontend packages on first run, starts both app processes, and prints their URLs. On `main`, open:

```text
http://main.myapp.localhost:8088
```

Use an explicit name when the directory is not a git worktree:

```bash
./tools/dev-slot.sh up demo
```

## Manage slots

Run these commands from any copy of the sample:

```bash
./tools/dev-slot.sh status
./tools/dev-slot.sh down
./tools/dev-slot.sh infra-down
```

`down` stops only the current slot. `infra-down` refuses to stop Caddy and Cosmos while known slots remain. Cosmos data is stored in a Docker volume and survives normal restarts.

Runtime state and logs live under `~/.config/myapp`. Set `MYAPP_STATE_DIR` to use a different state directory.

## What runs where

| Component | Lifetime | Address |
| --- | --- | --- |
| Caddy | Shared | `http://localhost:8088` |
| Cosmos DB emulator | Shared | `https://localhost:8081` |
| Cosmos Data Explorer | Shared | `http://localhost:1234` |
| React frontend | Per slot | `http://<slot>.myapp.localhost:8088` |
| .NET API | Per slot | `http://api-<slot>.myapp.localhost:8088` |
| Cosmos database | Per slot | `myapp-<slot>` |

The Caddy container reaches the host-run frontend and API through `host.docker.internal`. The Compose host-gateway mapping provides the same name on Linux.