# Running Many Copies of Your App at Once: Git Worktrees + Caddy for Isolated Local Dev

*A hands-on guide to running multiple isolated instances of a React + .NET + Cosmos DB app on one
machine — one per feature branch — each on its own local URL, sharing a single database emulator.*

> **Companion post:** for the source-control side of this story — why worktrees are the right
> primitive for running fleets of AI agents — see
> [Git Worktrees for Agentic Development](./git-worktrees-for-agentic-development.md).

---

## Why this post exists

You have a normal three-tier app: a React frontend, a .NET API, and a Cosmos DB database. You run it
locally every day and it works great — until the day you need to run **two** of them at once.

Maybe you're reviewing a teammate's PR while your own feature is still running. Maybe you're an AI
coding agent spinning up three branches in parallel. Maybe you just want to compare `main` against
your branch side by side. The moment a second instance starts, everything collides: the same ports,
the same database, the same `.env` files.

This post builds a small system — call it **dev slots** — that gives every git worktree its own
running copy of the app at its own URL, while sharing the heavy stuff (one database emulator, one
reverse proxy). By the end you'll have copy-paste `docker-compose`, `Caddyfile`, and a `dev-slot.sh`
script you can drop into any React + .NET + Cosmos project.

We keep it **auth-free** to stay focused. Real production apps add an OAuth callback wrinkle at the
end; we'll point at it but not build it here.

---

## Part 1 — The project setup

Let's start with a minimal but realistic app. Nothing here is special yet — it's the app you already
have.

### Folder layout

```text
myapp/
├── frontend/                 # Vite + React
│   ├── src/
│   ├── .env.local
│   ├── package.json
│   └── vite.config.ts
├── api/                      # ASP.NET Core minimal API
│   ├── Program.cs
│   ├── appsettings.json
│   └── api.csproj
└── tools/
    └── dev-slot.sh           # we'll build this
```

### The API (talks to Cosmos)

```csharp
// api/Program.cs
using Microsoft.Azure.Cosmos;

var builder = WebApplication.CreateBuilder(args);

// Config comes from appsettings.json OR environment variables.
var endpoint = builder.Configuration["Cosmos:Endpoint"]
    ?? "https://localhost:8081";
var key = builder.Configuration["Cosmos:Key"]
    ?? "C2y6yDjf5/R+ob0N8A7Cgv30VRDJIWEHLM+4QDU5DE2nQ9nDuVTqobD4b8mGGyPMbIZnqyMsEcaGQy67XIw/Jw=="; // well-known emulator key
var databaseName = builder.Configuration["Cosmos:Database"]
    ?? "myapp";

var cosmos = new CosmosClient(endpoint, key, new CosmosClientOptions
{
    // The emulator uses a self-signed cert; trust it in dev only.
    ServerCertificateCustomValidationCallback = (_, _, _) => true,
});

var db = await cosmos.CreateDatabaseIfNotExistsAsync(databaseName);
var container = await db.Database.CreateContainerIfNotExistsAsync("notes", "/id");

var app = builder.Build();

app.MapGet("/api/notes", async () =>
{
    var query = container.Container.GetItemQueryIterator<object>("SELECT * FROM c");
    var results = new List<object>();
    while (query.HasMoreResults)
        results.AddRange(await query.ReadNextAsync());
    return Results.Ok(results);
});

app.MapPost("/api/notes", async (Note note) =>
{
    note.Id = Guid.NewGuid().ToString();
    await container.Container.CreateItemAsync(note, new PartitionKey(note.Id));
    return Results.Created($"/api/notes/{note.Id}", note);
});

app.Run();

record Note
{
    public string Id { get; set; } = "";
    public string Text { get; set; } = "";
}
```

The two config values that matter for this whole post are:

- `Cosmos:Endpoint` — where the database lives (the shared emulator).
- `Cosmos:Database` — **which database inside it** this instance uses. This is our isolation lever.

### The frontend (talks to the API)

```ts
// frontend/src/api.ts
const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:5080";

export async function getNotes() {
  const res = await fetch(`${API_BASE}/api/notes`);
  return res.json();
}
```

```ini
# frontend/.env.local
VITE_API_BASE=http://localhost:5080
```

### The naive single-instance run

Today you probably run three things by hand:

```bash
# 1. Start the Cosmos emulator (Docker)
docker run -d --name cosmos -p 8081:8081 -p 10250-10255:10250-10255 \
  mcr.microsoft.com/cosmosdb/linux/azure-cosmos-emulator:latest

# 2. Start the API on :5080
cd api && dotnet run --urls http://localhost:5080

# 3. Start the frontend on :5173
cd frontend && npm run dev
```

Open `http://localhost:5173`, and you're developing. Everything is on **fixed ports** and a
**single database**. That's the root of the problem we're about to hit.

---

## Part 2 — The problem: two instances collide on everything

Now start a second copy — a second branch, a second agent, a second terminal. Watch what breaks:

| Resource | Instance A | Instance B | Result |
| --- | --- | --- | --- |
| Frontend port | `5173` | `5173` | ❌ "Port already in use" (or Vite silently picks 5174, breaking your API base-URL assumptions) |
| API port | `5080` | `5080` | ❌ Bind failure |
| Cosmos emulator | `8081` | `8081` | ❌ Only one emulator can own the port |
| Database contents | `myapp` | `myapp` | ❌ Both write to the **same** notes — data bleed between branches |
| `frontend/.env.local` | edited | edited | ❌ Two branches fighting over one file |

The naive fix — "just change the ports each time" — falls apart fast:

- You have to remember which branch is on which port.
- The frontend's `VITE_API_BASE` has to be hand-edited to match the API's port every time.
- Bookmarks and OAuth redirect URIs (if you had auth) are port-specific.
- An automated agent can't "just remember" — it needs deterministic, collision-free addressing.

What we actually want:

> Each worktree gets a **stable, human-readable URL** and a **private database**, while a **single**
> emulator and proxy are shared to keep resource use sane.

---

## Part 3 — The solution starts with git worktrees

A **git worktree** lets you check out multiple branches of the same repo into different directories
simultaneously — sharing one `.git` history, but with independent working files.

```bash
# From your main clone:
git worktree add ../myapp-feature-search feature/search
git worktree add ../myapp-bugfix-notes   bugfix/notes-crash
```

Now you have three directories, each on its own branch:

```text
~/code/myapp                    (main)
~/code/myapp-feature-search     (feature/search)
~/code/myapp-bugfix-notes       (bugfix/notes-crash)
```

Each of these is a natural unit of isolation. We'll call each running instance a **slot**, and we'll
**derive the slot name from the branch**. That gives us:

- `feature/search` → slot `feature-search`
- `bugfix/notes-crash` → slot `bugfix-notes-crash`

Deriving the name from the branch means the URL is *predictable*: you never have to look up "which
port am I on again?" — the address is a function of the branch you're standing in.

Here's the sanitization logic (lowercase, replace any run of non-alphanumeric characters with a
single dash, trim leading/trailing dashes):

```bash
sanitize_slot_name() {
  printf '%s' "$1" \
    | tr '[:upper:]' '[:lower:]' \
    | sed -E 's/[^a-z0-9]+/-/g; s/^-+//; s/-+$//'
}

# feature/Search#2  ->  feature-search-2
```

But a name alone doesn't route traffic. If slot `feature-search` runs its frontend on port 6001 and
`bugfix-notes-crash` on 6002, nobody wants to memorize those numbers. We need something that turns a
**name** into a **URL**. That's where Caddy comes in.

---

## Part 4 — The need for Caddy and local URLs

We want to type this:

```text
http://feature-search.myapp.localhost:8088          # frontend
http://api-feature-search.myapp.localhost:8088       # API
```

...and have it reach the right per-slot processes — even though those processes are on arbitrary,
internal ports like 6001/5501.

Two facts make this pleasant:

1. **`*.localhost` resolves to `127.0.0.1` automatically** in every modern browser (Chrome, Edge,
   Firefox, Safari). You do **not** need to edit `/etc/hosts` for each slot. Any subdomain —
   `anything.myapp.localhost` — just works.
2. **A reverse proxy can route by hostname.** [Caddy](https://caddyserver.com/) reads the incoming
   `Host` header and forwards to a different backend per host.

So we run **one** Caddy instance on port `8088`, and it fans out by hostname:

```caddyfile
# Caddyfile (conceptual)
http://feature-search.myapp.localhost:8088 {
	reverse_proxy localhost:6001        # this slot's Vite dev server
}

http://api-feature-search.myapp.localhost:8088 {
	reverse_proxy localhost:5501        # this slot's .NET API
}

http://bugfix-notes-crash.myapp.localhost:8088 {
	reverse_proxy localhost:6002
}

http://api-bugfix-notes-crash.myapp.localhost:8088 {
	reverse_proxy localhost:5502
}
```

The magic: **the internal ports can be anything**, because nobody types them. Humans and browsers
only ever see `<slot>.myapp.localhost:8088`. Caddy is the single front door that knows the internal
map.

Now the frontend's `VITE_API_BASE` becomes a clean function of the slot name — no port bookkeeping:

```ini
# frontend/.env.local  (generated per slot)
VITE_API_BASE=http://api-feature-search.myapp.localhost:8088
```

---

## Part 5 — Shared infrastructure vs. per-slot processes

Here's the mental model that ties it together:

```text
        ┌─────────────────── shared, one per machine ───────────────────┐
        │                                                               │
        │   Caddy  (:8088)            Cosmos emulator (:8081)           │
        │      │                            │                          │
        └──────┼────────────────────────────┼──────────────────────────┘
               │ routes by hostname          │ one endpoint, many DBs
   ┌───────────┼───────────────┐             │
   ▼           ▼               ▼             ▼
 slot A      slot B          slot C     database-per-slot:
 fe :6001    fe :6002        fe :6003     "myapp-feature-search"
 api :5501   api :5502       api :5503    "myapp-bugfix-notes-crash"
```

**Shared (start once, heavy):**
- **Cosmos emulator** on `8081` — starting a Cosmos emulator per slot would eat your RAM alive. One
  emulator can host many databases.
- **Caddy** on `8088` — one front door for every slot.

**Per slot (cheap, one each):**
- A **Vite dev server** on a port from a base + offset (e.g. `6000 + n`).
- A **.NET API** on a port from a base + offset (e.g. `5500 + n`).
- Its **own Cosmos database name** — `myapp-<slot>` — so writes never bleed across branches.

That last point is the data-isolation payoff: the emulator is shared, but each slot points
`Cosmos:Database` at a different database, so `feature-search` and `bugfix-notes-crash` never see
each other's notes.

```bash
# Per-slot API env — same endpoint, different database:
export Cosmos__Endpoint="https://localhost:8081"
export Cosmos__Database="myapp-feature-search"
```

(In .NET config, the `__` double-underscore maps to the `Cosmos:Database` nested key.)

---

## Part 6 — Wiring it together (copy-paste)

### 6.1 Shared infrastructure: `docker-compose.infra.yml`

This is the "start once per machine" stack — Cosmos + Caddy.

```yaml
# docker-compose.infra.yml
name: myapp-infra

services:
  cosmos:
    image: mcr.microsoft.com/cosmosdb/linux/azure-cosmos-emulator:latest
    container_name: myapp-cosmos
    ports:
      - "8081:8081"
      - "10250-10255:10250-10255"
    environment:
      AZURE_COSMOS_EMULATOR_PARTITION_COUNT: "10"

  caddy:
    image: caddy:2
    container_name: myapp-caddy
    network_mode: host          # so it can reach host-run slot processes on localhost
    volumes:
      - ${CADDY_STATE_DIR}/Caddyfile:/etc/caddy/Caddyfile:ro
```

> `network_mode: host` lets the containerized Caddy reach slot processes running directly on your
> host (`localhost:6001`, etc.). On macOS/Windows where host networking is limited, run slots as
> containers on a shared Docker network and point `reverse_proxy` at container names instead —
> that's the "Docker mode" mentioned at the end.

Start it:

```bash
export CADDY_STATE_DIR="$HOME/.config/myapp/caddy"
mkdir -p "$CADDY_STATE_DIR"
echo "{ auto_https off }" > "$CADDY_STATE_DIR/Caddyfile"   # seed an empty config

docker compose -f docker-compose.infra.yml up -d
```

### 6.2 The per-slot Caddyfile, regenerated on demand

We keep one **state directory per slot** recording its ports, then regenerate the whole Caddyfile
from those files and hot-reload Caddy. Each slot writes an `env` file:

```bash
# ~/.config/myapp/slots/feature-search/env
SLOT=feature-search
FRONTEND_UPSTREAM=localhost:6001
API_UPSTREAM=localhost:5501
```

Regeneration walks every slot's `env` file and emits a route pair, then reloads Caddy without
downtime:

```bash
regenerate_caddyfile() {
  local domain="myapp.localhost"
  local out="$CADDY_STATE_DIR/Caddyfile"

  echo "{ auto_https off }" > "$out"

  for env_file in "$SLOT_STATE_ROOT"/*/env; do
    [ -f "$env_file" ] || continue
    ( source "$env_file"
      cat >> "$out" <<EOF

http://${SLOT}.${domain}:8088 {
	reverse_proxy ${FRONTEND_UPSTREAM}
}

http://api-${SLOT}.${domain}:8088 {
	reverse_proxy ${API_UPSTREAM}
}
EOF
    )
  done

  # Hot-reload: no dropped connections for other slots.
  docker exec myapp-caddy caddy reload --config /etc/caddy/Caddyfile
}
```

This is the heart of the design: **adding or removing a slot never restarts the others.** Caddy just
reloads its route table.

### 6.3 The `dev-slot.sh` orchestrator

Now the script a developer (or agent) actually runs. It derives the slot, assigns deterministic
ports, writes config, starts the two processes, and refreshes Caddy.

```bash
#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DOMAIN="myapp.localhost"
PROXY_PORT=8088
API_PORT_BASE=5500
FRONTEND_PORT_BASE=6000
SLOT_STATE_ROOT="$HOME/.config/myapp/slots"
CADDY_STATE_DIR="$HOME/.config/myapp/caddy"

sanitize_slot_name() {
  printf '%s' "$1" \
    | tr '[:upper:]' '[:lower:]' \
    | sed -E 's/[^a-z0-9]+/-/g; s/^-+//; s/-+$//'
}

# Slot name defaults to the current git branch.
default_slot_name() {
  git -C "$ROOT_DIR" branch --show-current 2>/dev/null || basename "$ROOT_DIR"
}

# Turn a slot name into a stable small integer for port offsets.
slot_offset() {
  local sum=0 ch
  for (( i=0; i<${#1}; i++ )); do
    printf -v ch '%d' "'${1:$i:1}"
    sum=$(( (sum + ch) % 200 ))
  done
  echo "$sum"
}

cmd_up() {
  local slot; slot="$(sanitize_slot_name "${1:-$(default_slot_name)}")"
  local offset; offset="$(slot_offset "$slot")"
  local api_port=$(( API_PORT_BASE + offset ))
  local fe_port=$(( FRONTEND_PORT_BASE + offset ))
  local slot_dir="$SLOT_STATE_ROOT/$slot"
  mkdir -p "$slot_dir"

  # 1. Record this slot's routing info for Caddy.
  cat > "$slot_dir/env" <<EOF
SLOT=$slot
FRONTEND_UPSTREAM=localhost:$fe_port
API_UPSTREAM=localhost:$api_port
EOF

  # 2. Point the frontend at this slot's API (through the proxy).
  cat > "$ROOT_DIR/frontend/.env.local" <<EOF
VITE_API_BASE=http://api-$slot.$DOMAIN:$PROXY_PORT
EOF

  # 3. Start the API with a per-slot database.
  ( cd "$ROOT_DIR/api"
    Cosmos__Endpoint="https://localhost:8081" \
    Cosmos__Database="myapp-$slot" \
    dotnet run --urls "http://localhost:$api_port" \
      > "$slot_dir/api.log" 2>&1 & echo $! > "$slot_dir/api.pid" )

  # 4. Start the frontend on its slot port.
  ( cd "$ROOT_DIR/frontend"
    npm run dev -- --port "$fe_port" --strictPort \
      > "$slot_dir/frontend.log" 2>&1 & echo $! > "$slot_dir/frontend.pid" )

  # 5. Refresh the proxy so the new URLs route.
  regenerate_caddyfile

  echo "Slot '$slot' is up:"
  echo "  Frontend: http://$slot.$DOMAIN:$PROXY_PORT"
  echo "  API:      http://api-$slot.$DOMAIN:$PROXY_PORT"
  echo "  Database: myapp-$slot"
}

cmd_down() {
  local slot; slot="$(sanitize_slot_name "${1:-$(default_slot_name)}")"
  local slot_dir="$SLOT_STATE_ROOT/$slot"
  [ -f "$slot_dir/api.pid" ] && kill "$(cat "$slot_dir/api.pid")" 2>/dev/null || true
  [ -f "$slot_dir/frontend.pid" ] && kill "$(cat "$slot_dir/frontend.pid")" 2>/dev/null || true
  rm -rf "$slot_dir"
  regenerate_caddyfile
  echo "Slot '$slot' stopped."
}

cmd_status() {
  echo "Known slots:"
  for slot_dir in "$SLOT_STATE_ROOT"/*/; do
    [ -d "$slot_dir" ] || continue
    ( source "$slot_dir/env"
      echo "  $SLOT -> http://$SLOT.$DOMAIN:$PROXY_PORT (api $API_UPSTREAM)" )
  done
}

# Paste regenerate_caddyfile() from section 6.2 here.

case "${1:-}" in
  up)     shift; cmd_up "${1:-}" ;;
  down)   shift; cmd_down "${1:-}" ;;
  status) cmd_status ;;
  *) echo "Usage: dev-slot.sh {up|down|status} [slot]"; exit 2 ;;
esac
```

> The offset function here is a tiny deterministic hash so the same branch always lands on the same
> ports. Production-grade versions scan for free ports and persist the assignment; a stable hash is
> plenty to illustrate the idea.

---

## Part 7 — Lifecycle and safety rules

The daily flow, from any worktree:

```bash
# Once per machine — start shared Cosmos + Caddy:
docker compose -f docker-compose.infra.yml up -d

# In each worktree — start that branch's slot:
./tools/dev-slot.sh up

# See what's running:
./tools/dev-slot.sh status

# Tail logs (they live in the slot's state dir):
tail -f ~/.config/myapp/slots/feature-search/api.log

# Stop just your slot when done:
./tools/dev-slot.sh down
```

A few rules keep parallel developers (and agents) from stepping on each other:

1. **Don't run your old single-instance setup and the shared infra at the same time.** Both want
   Cosmos on port `8081`. Pick one.
2. **`infra up` is idempotent** — safe to run even if it's already up. Slots assume it's running.
3. **Only tear down *your* slot.** `dev-slot.sh down` touches only the current branch's processes.
4. **Don't stop shared infra while other slots are alive.** Check `status` first — pulling Cosmos or
   Caddy out from under a running slot breaks everyone.

---

## Wrapping up

The whole trick reduces to three moves:

1. **One slot per git worktree**, with a name derived deterministically from the branch — so URLs
   are predictable, never memorized.
2. **A single Caddy reverse proxy** routing `<slot>.myapp.localhost:8088` by hostname to arbitrary
   internal ports — so humans and browsers never touch a port number.
3. **Shared heavy infra, cheap per-slot processes** — one Cosmos emulator hosting a
   **database-per-slot**, plus a lightweight frontend + API process pair per slot.

Add slots, remove slots, run five branches at once — the shared infra stays put and Caddy just
reloads its route table. No port collisions, no data bleed, no `.env` tug-of-war.

### Where to go from here

- **OAuth / Entra sign-in.** Providers require a *fixed* redirect URI, which fights with dynamic
  slot URLs. The fix is a small **callback bridge**: register one fixed redirect (e.g.
  `http://localhost:5173`), have Caddy serve a tiny page there that reads the auth response and
  forwards it back to the originating `<slot>.myapp.localhost` URL. That's a whole post on its own —
  we deliberately kept this one auth-free.
- **Docker-mode slots.** Instead of host processes, run each slot's frontend + API as containers on
  a shared Docker network and point `reverse_proxy` at container names. This removes the need for
  host .NET/Node entirely — ideal for autonomous agents.
- **Automatic free-port assignment.** Replace the hash-based offset with a scan-and-persist port
  allocator to guarantee no collisions even across many long-lived slots.

Clone it, rename `myapp` to your project, and you've got parallel local development that scales from
one developer to a swarm of agents.
