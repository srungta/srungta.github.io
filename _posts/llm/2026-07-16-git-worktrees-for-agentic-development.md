---
layout: post
unique_id: LLMWT01
title: Git Worktrees for Agentic Development
subtitle: How git worktree turns a single repository into many isolated, parallel workspaces — and why that's the missing primitive for running AI coding agents.
tldr: Use git worktrees to give every AI agent its own isolated working directory without duplicating the repository history.
permalink: /blog/llm/git-worktrees-for-agentic-development
author: srungta
tags:
  - LLM
  - Git
  - Agentic Development

series:
  id: LLM
  index: 4

featured: true
isNew: true
---

## The problem agents create

Most development workflows assume that one developer is doing one thing at a time: check out a
branch, make changes, run tests, commit, and move on. In that model, one working directory is
plenty.

AI coding agents break that assumption. The whole point of an agent is that you can run **many at
once**: one fixing a bug, one writing tests, one refactoring a module, one exploring a risky idea
you're not sure about. Suddenly, the working directory becomes a shared resource, and the obvious
workarounds start to break down:

- **Sharing one checkout** — agents overwrite each other's uncommitted files. Agent A's
  half-finished refactor corrupts Agent B's test run. `git checkout` by one agent yanks the ground
  out from under another.
- **Full `git clone` per agent** — every clone re-downloads the entire history. For a large repo
  that can mean gigabytes and minutes *per agent*, plus multiple copies of `.git` consuming disk.
- **Stash juggling** — `git stash` to swap contexts is fragile, serial, and impossible to
  parallelize.

What agents actually need is **isolation without duplication**: many independent working
directories that don't interfere, but that share one history so branches, commits, and fetches are
instant and cheap.

Branches alone do not solve this. A branch identifies an independent line of history, but creating
one does not create another working directory. For that, each agent needs a worktree of its own.

That primitive already ships with Git. It is called a **worktree**.

---

## What a worktree actually is

`git worktree` lets one repository have **multiple working directories checked out at the same
time**, each on its own branch, all backed by a **single shared `.git` object store**.

```bash
# In your main clone (on `main`):
git worktree add -b feature/search ../repo-agent-a main
git worktree add -b bugfix/crash ../repo-agent-b main
git worktree add -b chore/deps ../repo-agent-c main
```

You now have four directories on disk:

```text
~/code/repo              (main)              ← the primary worktree
~/code/repo-agent-a      (feature/search)
~/code/repo-agent-b      (bugfix/crash)
~/code/repo-agent-c      (chore/deps)
```

Each directory has its own working files, index, and `HEAD`. But there is only **one** copy of the
repository's history: the objects, refs, and packfiles are shared through the repository's common
Git directory. Creating a worktree does **not** re-download or duplicate that history, so it is
typically fast even for a large repository.

```text
                 ┌──────────────────────────────┐
                 │   shared object store (.git) │
                 │   commits · trees · blobs     │
                 └───────────────┬──────────────┘
             ┌───────────────────┼───────────────────┐
             ▼                   ▼                   ▼
     worktree: agent-a    worktree: agent-b    worktree: agent-c
     feature/search       bugfix/crash         chore/deps
     own files + index    own files + index    own files + index
```

The result is the useful combination: shared history, independent files. That is exactly the
isolation parallel agents need.

---

## Why worktrees fit agentic development so well

### 1. True parallelism with no cross-talk

Each agent operates in its own directory. Agent A can run a failing build, rewrite ten files, and
run tests — while Agent B does something completely different — and neither sees the other's
uncommitted work. No lockstep, no "please wait, someone else is building."

### 2. Cheap to create and destroy

Because history is shared, spinning up a worktree is near-instant and costs only the checked-out
files, not another copy of `.git`. That makes worktrees disposable: create one per task, throw it
away when the task merges. Perfect for an orchestrator that launches and reaps agents on demand.

```bash
git worktree add ../repo-task-1234 -b agent/task-1234   # create + new branch in one step
# ... agent works, commits, opens a PR ...
git worktree remove ../repo-task-1234                    # reap when done
```

### 3. One branch per agent, enforced by construction

Git **refuses to check out the same branch in two worktrees at once**. That guardrail maps perfectly
onto "one agent owns one branch": you literally cannot have two agents accidentally sharing a
branch's working state.

### 4. Instant context switching for the orchestrator

A supervising process (or a human reviewing agent output) can `cd` between worktrees to inspect each
agent's in-progress state, run its tests, or diff its changes — without disturbing any agent. No
stashing, no branch swapping, no rebuild-from-scratch.

### 5. Shared fetches and reusable caches

`git fetch` in any worktree updates the shared object store, so every worktree sees new upstream
commits without separate downloads. Dependency directories remain independent, but package-manager
caches can also be shared across worktrees. Together, those two choices keep new agent workspaces
cheap to start.

---

## A minimal agent-orchestration pattern

The Git commands are small enough to wrap in an orchestration script. The following example creates
one worktree and branch per task, returns the path to the caller, and removes the worktree when the
task is done.

```bash
#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
WORKTREE_ROOT="${REPO_ROOT}/../agents"     # keep agent worktrees beside the main clone

# Create an isolated worktree + branch for a task, echo its path.
spawn_worktree() {
  local task_id="$1"
  local slug; slug="$(printf '%s' "$task_id" | tr '[:upper:]' '[:lower:]' | sed -E 's/[^a-z0-9]+/-/g')"
  local dir="${WORKTREE_ROOT}/${slug}"
  local branch="agent/${slug}"

  git -C "$REPO_ROOT" worktree add --quiet -b "$branch" "$dir" origin/main
  printf '%s\n' "$dir"
}

# Reap a finished task's worktree (branch is preserved for its PR).
reap_worktree() {
  local task_id="$1"
  local slug; slug="$(printf '%s' "$task_id" | tr '[:upper:]' '[:lower:]' | sed -E 's/[^a-z0-9]+/-/g')"
  git -C "$REPO_ROOT" worktree remove --force "${WORKTREE_ROOT}/${slug}"
}

# --- usage ---
dir="$(spawn_worktree 'TASK-1234 fix null ref')"
echo "Agent workspace: $dir"
# hand $dir to the agent; it edits, commits, and opens a PR from branch agent/task-1234
# later:
# reap_worktree 'TASK-1234 fix null ref'
```

The agent is handed a **path** and told "this is your world." It can commit to its assigned branch
without coordinating checkouts or stashes with the other agents running beside it.

---

## Sharp edges (and how to handle them)

Worktrees are powerful but a few things surprise newcomers:

- **A branch can only be checked out in one worktree.** This is a feature, not a bug — it prevents
  two agents from corrupting the same branch. If you need two views of one branch, create a second
  branch from it (`git worktree add ../view -b copy-of-x x`) or use a detached checkout
  (`git worktree add --detach ../view x`).
- **Untracked files are NOT shared.** `node_modules`, build outputs, `.env` files, and other
  gitignored artifacts exist independently in each worktree. Each agent must install dependencies
  and generate build artifacts in its own directory — or you point them at a shared cache
  (package-manager stores, NuGet, Go, or pip caches, for example) to avoid downloading everything
  again.
- **Reap orphaned worktrees.** If a directory is deleted without `git worktree remove`, Git keeps a
  dangling administrative record. Run `git worktree prune` (or `git worktree remove --force`)
  periodically. `git worktree list` shows everything currently registered.
- **Submodules need care.** Repos with submodules require
  `git worktree add` plus submodule init inside each worktree; plan for it if you use them.
- **Long-lived worktrees drift.** Fetch and rebase/merge in each worktree just like any branch; the
  shared object store means the fetch is cheap, but the merge is still per-worktree work.

```bash
git worktree list           # see all worktrees and their branches
git worktree prune          # clean up records for manually-deleted worktrees
git worktree remove <path>  # the correct way to delete a worktree
```

---

## Where this leads: worktrees + running apps

Worktrees solve the **source-code** side of parallel agentic development: many isolated checkouts,
one shared history, cheap to spawn and reap. But agents rarely just edit files — they need to *run*
what they built: start the frontend, hit the API, read and write the database, click through the UI.

The moment two agents try to run the app at the same time, you hit a second collision problem —
ports, databases, and config all clash — that worktrees alone don't solve. That's the runtime layer:
giving each worktree its own **running instance** at its own URL, sharing heavy infrastructure.

That is exactly what the companion post builds:
[**Running Many Copies of Your App at Once: Git Worktrees + Caddy**](/blog/llm/multi-slot-local-dev-with-worktrees-and-caddy).

Together they form the full picture for agentic development:

| Layer | Primitive | What it isolates |
| --- | --- | --- |
| Source code | `git worktree` | Working files, index, branch per agent |
| Runtime | Dev slots + Caddy | Ports, URLs, and database per running instance |

---

## Wrapping up

For agentic development, `git worktree` is the quiet workhorse:

1. **Isolation without duplication** — many working directories, one shared history.
2. **Cheap and disposable** — spawn a worktree per task, reap it on merge.
3. **Safe by construction** — one branch per worktree keeps agents from corrupting each other.
4. **Orchestrator-friendly** — inspect, test, and diff any agent's state without disturbing it.

The important shift is simple: stop treating the repository checkout as shared agent
infrastructure. Give every agent its own worktree, and parallel development becomes a set of
independent, reproducible workspaces. Add dev slots on top, and each workspace gets an isolated
running app as well.
