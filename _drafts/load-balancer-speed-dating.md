---
layout: post
unique_id: WEB07

title: I Asked 1000 Servers the Same Question - Load Balancer Speed Dating
subtitle: Sticky sessions (clingy exes), health checks (compatibility tests), and server affinity (finding "the one")
tldr: Load balancers are matchmakers between users and servers. Let's explore load balancing through the lens of speed dating, relationship drama, and finding the perfect match.
# permalink: /blog/web/load-balancer-speed-dating
author: srungta
tags:
  - Web
  - System Design
  - Load Balancing
  - Humor

series:
  id: DISTRIB
  index: 2
---


## Welcome to Server Speed Dating

**Host:** Welcome! Tonight we have 1000 users looking for servers. We also have 10 servers looking for users. Let's see who matches!

**User 1:** I need to upload a file.

**Host:** Great! Server 3 is available and has low CPU usage. Perfect match!

**User 2:** I need to upload a file too.

**Host:** Server 3 is now busy. Let's try Server 7!

**User 1:** Wait, I need to upload another chunk of my file.

**Host:** Server 7 is free now!

**User 1:** But my first chunk is on Server 3...

**Host:** Oh. Awkward.

This is load balancing. It's matchmaking for computers.

## The Basic Algorithms (Dating Strategies)

### Round Robin (The Fair One)

```
User 1 → Server 1
User 2 → Server 2
User 3 → Server 3
User 4 → Server 1
User 5 → Server 2
```

**Personality:** "Everyone gets a turn. I'm perfectly fair."

**Strengths:**
- Simple
- Predictable
- Everyone gets equal opportunity

**Weaknesses:**
- Doesn't account for server capabilities
- Ignores current load
- Treats all requests as equal

**Dating analogy:** It's like matching people based purely on arrival order, ignoring whether they're compatible.

**When it breaks:**
```
Server 1: Handles simple login (50ms)
Server 2: Handles complex report generation (30 seconds)
Server 3: Handles simple login (50ms)

Round robin sends every 3rd request to Server 2.
Server 2 gets overwhelmed. Server 1 and 3 sit idle.
```

### Least Connections (The Optimal Matcher)

```
Server 1: 5 active connections
Server 2: 3 active connections
Server 3: 8 active connections

New user → Send to Server 2 (has fewest connections)
```

**Personality:** "I find the least busy server. Efficiency matters."

**Strengths:**
- Accounts for current load
- Adapts to traffic patterns
- Generally fair

**Weaknesses:**
- Connections aren't equal (some are idle, some are active)
- Doesn't account for server capabilities
- More complex to implement

**Dating analogy:** Matching people with whoever is talking to the fewest people, assuming that means they're available.

**When it breaks:**
```
Server 1: 2 connections (both downloading 1GB files, maxing out CPU)
Server 2: 10 connections (all idle keep-alive connections)

Least connections sends new request to Server 1.
Server 1 dies. Server 2 is actually free.
```

### Least Response Time (The Smart One)

```
Server 1: Average response time 50ms
Server 2: Average response time 200ms
Server 3: Average response time 100ms

New user → Send to Server 1 (fastest responder)
```

**Personality:** "I measure actual performance and route to the fastest server."

**Strengths:**
- Accounts for real performance
- Adapts to server health
- Users get fastest possible response

**Weaknesses:**
- Requires health checks
- Can create feedback loops (slow server gets no traffic, stays "fast" with no load)
- More complex to implement

**Dating analogy:** Matching based on how quickly people respond to messages.

### IP Hash (The Faithful One)

```
hash(user_ip) % num_servers = assigned_server

User from IP 1.2.3.4 → Always Server 2
User from IP 5.6.7.8 → Always Server 1
```

**Personality:** "Once you're matched, you stick together."

**Strengths:**
- Consistent routing
- Good for caching (same user always hits same server)
- Simple deterministic logic

**Weaknesses:**
- Uneven distribution if IPs aren't random
- Adding/removing servers breaks everything
- No accounting for server health

**Dating analogy:** Matching based on birthday. People born in January always get paired with Server 1, people born in February with Server 2, etc.

**When it breaks:**
```
Corporate network: All users behind single NAT IP
hash(corporate_ip) → Server 3

Server 3 gets 10,000 users.
Server 1 and 2 sit idle.
```

## Sticky Sessions (The Clingy Ex)

### The Problem

User logs in. Session data stored on Server 1. User makes next request. Load balancer sends them to Server 2. Server 2 says "Who are you? I don't know you."

### The Solution

Sticky sessions: Once a user is matched with a server, they stay with that server.

```
User 1 → Server 1 (store cookie: server=1)
User 1 makes another request → Check cookie → Send to Server 1 again
```

**Why it's like a clingy ex:**

**User:** I'd like to make a request.

**Load Balancer:** You're going to Server 1.

**User:** But Server 1 is overloaded. Can I talk to Server 2?

**Load Balancer:** No. You belong to Server 1.

**User:** But—

**Load Balancer:** SERVER 1. ALWAYS SERVER 1.

### The Problems with Sticky Sessions

1. **Uneven load** - Once a server gets busy users, they stay busy
2. **Server death** - If Server 1 dies, all its users lose their sessions
3. **Can't rebalance** - Even if Server 2 is idle, users stuck on Server 1 can't move
4. **Session lock-in** - Users can't benefit from adding new servers

**Better solutions:**
- Store sessions in a shared store (Redis, database)
- Use JWTs (session data in the token, no server-side storage)
- Accept that sessions might break occasionally

## Health Checks (The Compatibility Test)

Before sending users to a server, check if the server is actually healthy.

### Basic Health Check (Ping)

```
Load Balancer: "Hey Server 1, are you alive?"
Server 1: "200 OK"
Load Balancer: "Great, here's a user."
```

**Dating analogy:** "Are you breathing? Good, you're compatible."

**Problem:** Alive ≠ Healthy

```
Server 1: "200 OK" (CPU at 100%, can't actually handle requests)
Load Balancer: "You said you're fine!"
Server 1: *crashes*
```

### Smart Health Check (Deep Check)

```
Load Balancer: "Hey Server 1, can you connect to the database?"
Server 1: (checks database) "Yes, database is reachable."
Load Balancer: "Can you process a test request?"
Server 1: (processes test) "Yes, took 50ms."
Load Balancer: "Great, here's a user."
```

**Dating analogy:** Asking compatibility questions before the date.

**Trade-off:** More accurate, but health checks themselves consume resources.

### Passive Health Check (Learning from Failures)

```
User → Server 1 → 500 error
Load Balancer: "Hmm, Server 1 returned an error. Mark it as possibly unhealthy."

User → Server 1 → 500 error again
Load Balancer: "Server 1 is definitely sick. Stop sending users there."

(After some time)
Load Balancer: "Let me try Server 1 again with one test user..."
User → Server 1 → 200 OK
Load Balancer: "Server 1 is back! Resume normal traffic."
```

**Dating analogy:** Learning from failed dates instead of pre-screening.

## Server Affinity (Finding "The One")

Some requests are better served by specific servers.

### Geographic Affinity

```
User in US → Send to US server
User in Europe → Send to European server
User in Asia → Send to Asian server
```

**Why:** Latency. Closer server = faster response.

**Dating analogy:** Long-distance relationships are hard. Find someone local.

### Resource Affinity

```
Upload requests → Servers with fast storage
CPU-intensive requests → Servers with powerful CPUs  
Memory-intensive requests → Servers with lots of RAM
```

**Why:** Not all servers are equal. Use the right tool for the job.

**Dating analogy:** Matching based on shared interests.

### Session Affinity (Back to Clingy Ex)

```
User 1 first request → Server 1 (stores session)
User 1 subsequent requests → Server 1 (needs same session)
```

**Why:** Session data is stored on specific server.

**Better approach:** Don't store sessions on servers. Use shared session store.

## Graceful Shutdown (The Breakup)

Server needs to restart for updates. But it has active users. What do you do?

### Rude Shutdown

```
Server 1: "I'm restarting now. Bye."
Load Balancer: "Wait—"
Users on Server 1: *all connections dropped*
```

**Dating analogy:** Ghosting.

### Graceful Shutdown

```
Server 1: "I need to restart soon. Stop sending me new users."
Load Balancer: "Okay, marking you as draining."
(Existing connections finish)
(No new connections sent)
(After all users done)
Server 1: "All users gone. Restarting now."
```

**Dating analogy:** "It's not you, it's me. Let me finish my commitments, then we can part ways."

**Implementation:**
```
1. Mark server as "draining"
2. Stop sending new requests
3. Wait for existing requests to finish (with timeout)
4. Close remaining connections
5. Shut down
```

## The Thundering Herd Problem (Everyone Rushes the Same Server)

### The Scenario

All 10 servers restart at the same time for updates. They all come back online simultaneously.

```
Health Check: Server 1 is back!
Health Check: Server 2 is back!
...
Health Check: Server 10 is back!

(All 1000 waiting users rush to the servers at once)

All servers: *immediate overload*
```

**Dating analogy:** Speed dating event where everyone tries to talk to the same person at once.

### The Solution: Staggered Rollouts

```
Restart Server 1 → Wait → Verify healthy → Restart Server 2 → Wait → ...
```

Or:

```
Bring server online → Send 10% traffic → Monitor → Send 50% traffic → Monitor → Send 100% traffic
```

## Real-World Scenario: Black Friday

**8 AM:** Normal traffic. 10 servers handle it easily.

**12 PM:** Flash sale starts. Traffic spikes 100x.

**What happens:**
1. Load balancer distributes users across 10 servers
2. All 10 servers immediately overload
3. Health checks start failing
4. Load balancer removes unhealthy servers
5. Traffic concentrates on fewer servers
6. Remaining servers overload faster
7. **Cascading failure** - All servers die

**What should happen:**
1. Auto-scaling adds 90 more servers (100 total)
2. Load balancer gradually sends traffic to new servers
3. All servers stay healthy
4. Flash sale succeeds

**Reality:**
- Auto-scaling takes 5 minutes to spin up new servers
- Health checks aren't fast enough
- Some servers die before scaling completes
- Your site is on Hacker News with the title "Major Retailer Website Crashes on Black Friday"

## Key Takeaways

1. **Round robin is simple but naive** - Use it for homogeneous servers with similar requests
2. **Least connections is better** - But connections ≠ load
3. **Least response time is best** - But requires good health checks
4. **Sticky sessions are technical debt** - Use shared session storage instead
5. **Health checks are critical** - But they can lie
6. **Graceful shutdown prevents user impact** - Plan for restarts
7. **Auto-scaling needs to be fast** - 5 minutes is an eternity during a spike

## Conclusion

Load balancing is matchmaking. You're trying to pair users with servers in a way that makes everyone happy.

Round robin is speed dating - everyone gets a turn.

Least connections is compatibility matching - find who's least busy.

Sticky sessions are clingy exes - you're stuck with your first match.

Health checks are background checks - make sure they're actually available.

And server affinity is finding "the one" - some matches are just better.

**Remember:** The best load balancer is the one you don't have to think about. Until it fails. Then you think about it a lot.

---

*Have you debugged a load balancer disaster? Dealt with sticky session hell? Survived a thundering herd? Share your stories.*
