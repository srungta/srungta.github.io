---
layout: post
unique_id: WEB05

title: My Cache Has Trust Issues - A Therapist's Guide to Cache Invalidation
subtitle: Is this data fresh? Can I trust it? What if it changed?
tldr: Caches are paranoid creatures with anxiety about staleness. Let's explore cache invalidation, TTL panic attacks, and why your cache needs therapy more than optimization.
permalink: /blog/web/cache-trust-issues
author: srungta
tags:
  - Web
  - System Design
  - Caching
  - Humor

series:
  id: WEB
  index: 3

image: /assets/images/web/WEB05/cover.svg
banner: /assets/images/web/WEB05/banner.png
---

## Session 1: Meeting Your Cache

**Therapist:** Tell me about your cache.

**Developer:** Well, it's... complicated. Sometimes it works great. Sometimes it serves stale data and users get mad. Sometimes it invalidates too aggressively and my database dies.

**Therapist:** It sounds like your cache has trust issues.

**Developer:** ...is that a thing?

**Therapist:** Oh yes. Very common. Let's start from the beginning.

## The Problem: Cache Doesn't Know What's True Anymore

Your cache has a simple job: remember things so you don't have to ask the database every time.

But here's the existential crisis: **How does the cache know if the data it remembers is still true?**

```javascript
// Cache: "User 123's email is alice@example.com"
// Reality: Alice just changed her email to alice@newdomain.com
// Cache: "But I remember it being alice@example.com?"
// Reality: "That was 5 minutes ago. Things change."
// Cache: *existential panic*
```

This is cache invalidation. It's one of the two hard problems in computer science, along with naming things and off-by-one errors.

## Cache Personality Types

### Type 1: The Optimist (Time-To-Live Cache)

```javascript
cache.set('user:123', userData, { ttl: 300 }); // 5 minutes
```

**Personality:** "I'll trust this data for 5 minutes. What could go wrong?"

| Strengths | Weaknesses |
| --- | --- |
| Simple | Serves stale data for up to 5 minutes |
| Predictable | Doesn't know when data actually changed |
| Doesn't overthink things | Lives in blissful ignorance |

**When it breaks down:**
```javascript
// User changes their email
updateEmail(userId, newEmail);

// Cache doesn't know for 5 minutes
cache.get('user:123'); // Still returns old email
```

**Therapy session:**

**Therapist:** How do you feel about serving stale data?

**Cache:** I don't like it, but I can't check the database every time. That defeats the purpose of caching.

**Therapist:** What if the data is critical? Like a password change?

**Cache:** *nervous sweating* I... I just hope 5 minutes isn't too long?

**Therapist:** That's avoidance behavior.

### Type 2: The Paranoid (Cache-Aside with Validation)

```javascript
const cached = cache.get('user:123');
if (cached && cached.version === db.getVersion('user:123')) {
  return cached;
}
// Version changed, data is stale
const fresh = db.get('user:123');
cache.set('user:123', fresh);
return fresh;
```

**Personality:** "Trust but verify. Actually, mostly verify."

| Strengths | Weaknesses |
| --- | --- |
| Never serves truly stale data | Still hits the database to check versions |
| Knows exactly when data changes | If version checking is expensive, you've defeated the purpose |
| Catches problems early | Constant anxiety about being wrong |

**Therapy session:**

**Therapist:** You check the version every single time?

**Cache:** What if it changed?

**Therapist:** But you're hitting the database anyway. Why cache at all?

**Cache:** Because checking the version is cheaper than fetching all the data! ...right?

**Therapist:** Is it though?

**Cache:** *existential crisis intensifies*

### Type 3: The Control Freak (Write-Through Cache)

```javascript
function updateUser(userId, newData) {
  // Update database
  db.update('users', userId, newData);
  
  // Immediately update cache
  cache.set(`user:${userId}`, newData);
}
```

**Personality:** "I control everything. If data changes, I'll know because *I'm* the one changing it."

| Strengths | Weaknesses |
| --- | --- |
| Cache is always consistent with writes | What about writes from other servers? |
| No stale data for writes you control | What about manual database updates? |
| Clear ownership | What about data that changes from external systems? |

**Therapy session:**

**Therapist:** What happens if someone updates the database directly?

**Cache:** That's not allowed. All writes go through me.

**Therapist:** But what if they do anyway?

**Cache:** THEY CAN'T. I CONTROL THE DATA.

**Therapist:** This is concerning. You're exhibiting control issues.

### Type 4: The Anxious Overthinker (Event-Driven Invalidation)

```javascript
// When data changes, publish an event
eventBus.publish('user.updated', { userId: 123 });

// Cache listens for events
eventBus.subscribe('user.updated', (event) => {
  cache.delete(`user:${event.userId}`);
});
```

**Personality:** "I need to know the moment ANYTHING changes ANYWHERE."

| Strengths | Weaknesses |
| --- | --- |
| Invalidates immediately when data changes | What if the event gets lost? |
| No TTL guessing | What if events arrive out of order? |
| Proactive, not reactive | What if the event system is down? |
| | Constant monitoring of event streams |

**Therapy session:**

**Therapist:** You're subscribed to 47 different event topics?

**Cache:** I need to know when things change!

**Therapist:** But you're spending all your time processing events instead of actually caching.

**Cache:** What if I miss an update?

**Therapist:** This is anxiety. You're catastrophizing.

## Common Cache Anxieties

### Anxiety 1: "What if I invalidate too early?"

```javascript
cache.set('user:123', data, { ttl: 10 }); // 10 seconds

// 5 seconds later
cache.delete('user:123'); // Oops, data was still fresh

// Now every request hits the database
```

**Symptom:** Over-invalidation. Cache has no confidence in its own data.

**Treatment:** Use longer TTLs with selective invalidation for critical paths.

### Anxiety 2: "What if I invalidate too late?"

```javascript
cache.set('user:123', data, { ttl: 3600 }); // 1 hour

// User changes password
updatePassword(userId, newPassword);

// Cache still serves old password hash for up to 1 hour
// User can't log in with new password
```

**Symptom:** Stale data causes user-facing bugs.

**Treatment:** Invalidate explicitly on writes. Don't rely solely on TTL for critical data.

### Anxiety 3: "What if multiple servers invalidate at different times?"

```javascript
// Server A
cache.delete('user:123');

// Server B (didn't get the memo)
cache.get('user:123'); // Still has stale data
```

**Symptom:** Distributed cache inconsistency. Different servers see different reality.

**Treatment:** Use a centralized cache (Redis) or cache invalidation events.

### Anxiety 4: "What if the database and cache disagree?"

```javascript
// Database says: email = alice@new.com
// Cache says: email = alice@old.com

// Who's right? Cache doesn't know.
```

**Symptom:** Split-brain. Truth has diverged.

**Treatment:** Database is always the source of truth. When in doubt, invalidate and refetch.

## The Cache Invalidation Patterns

### Pattern 1: Lazy Invalidation (TTL)

**How it works:** Set a timer. When timer expires, delete from cache.

**Pros:** Simple. Works everywhere.

**Cons:** Serves stale data until expiration.

**Best for:** Non-critical data that doesn't change often (user profiles, settings).

**Cache personality:** Optimistic.

### Pattern 2: Eager Invalidation (Write-Through)

**How it works:** Every write updates both database and cache.

**Pros:** Cache is always fresh after writes.

**Cons:** Doesn't catch external updates. Adds latency to writes.

**Best for:** Write-heavy workloads where you control all writes.

**Cache personality:** Control freak.

### Pattern 3: Event-Driven Invalidation

**How it works:** Publish events when data changes. Cache subscribes and invalidates.

**Pros:** Near-instant invalidation. Works across servers.

**Cons:** Complex. Event system becomes a dependency. Eventual consistency.

**Best for:** Distributed systems with multiple writers.

**Cache personality:** Anxious overthinker.

### Pattern 4: Versioned Data

**How it works:** Store version number with data. Check version before using cache.

**Pros:** Catches all changes. Works with any write pattern.

**Cons:** Extra database query to check version.

**Best for:** Critical data where staleness is unacceptable.

**Cache personality:** Paranoid.

### Pattern 5: No Cache (The Nuclear Option)

**How it works:** Don't cache. Just hit the database every time.

**Pros:** Never stale. Simple. No invalidation needed.

**Cons:** Slower. Database load increases.

**Best for:** Data that changes constantly or is queried rarely.

**Cache personality:** Has given up on therapy.

## Real-World Scenarios

### Scenario 1: User Profile

**Data:** Name, email, profile picture  
**Change frequency:** Rarely  
**Staleness tolerance:** High (users understand profile changes take a moment)  
**Solution:** TTL cache with 5-minute expiration + eager invalidation on profile updates

```javascript
function updateProfile(userId, newData) {
  db.update('users', userId, newData);
  cache.set(`user:${userId}`, newData, { ttl: 300 });
}

function getProfile(userId) {
  const cached = cache.get(`user:${userId}`);
  if (cached) return cached;
  
  const data = db.get('users', userId);
  cache.set(`user:${userId}`, data, { ttl: 300 });
  return data;
}
```

### Scenario 2: Inventory Count

**Data:** Number of items in stock  
**Change frequency:** Often (every purchase)  
**Staleness tolerance:** Low (can't oversell)  
**Solution:** Don't cache. Or cache with very short TTL + aggressive invalidation.

```javascript
function getInventory(productId) {
  // Don't cache. Always get fresh count.
  return db.get('inventory', productId);
}

// OR cache for 10 seconds max
function getInventory(productId) {
  const cached = cache.get(`inventory:${productId}`);
  if (cached) return cached;
  
  const data = db.get('inventory', productId);
  cache.set(`inventory:${productId}`, data, { ttl: 10 });
  return data;
}

function purchaseItem(productId) {
  db.decrementInventory(productId);
  cache.delete(`inventory:${productId}`); // Invalidate immediately
}
```

### Scenario 3: Session Data

**Data:** User's login session, preferences  
**Change frequency:** Rare (only when user logs in/out)  
**Staleness tolerance:** None (security-critical)  
**Solution:** Cache with no TTL + explicit invalidation on logout

```javascript
function createSession(userId, sessionData) {
  const sessionId = generateId();
  cache.set(`session:${sessionId}`, sessionData); // No TTL
  return sessionId;
}

function logout(sessionId) {
  cache.delete(`session:${sessionId}`); // Explicit invalidation
}
```

## The Two Rules of Cache Therapy

### Rule 1: Cache is a Hint, Not Truth

The database is the source of truth. Cache is a guess about what the database says.

If cache and database disagree, database wins. Always.

### Rule 2: Design for Staleness

Don't build systems that break when cache is stale. Build systems that gracefully handle stale data.

**Bad:** User changes password. Old password works for 5 minutes because cache.

**Good:** User changes password. Old password stops working immediately (password check always hits database). Profile picture might be stale for 5 minutes (that's fine).

## Key Takeaways

1. **All caches serve stale data eventually** - The question is how long you can tolerate
2. **TTL is a guess** - You're guessing how long data stays valid
3. **Invalidation is hard in distributed systems** - Multiple servers, eventual consistency, event ordering
4. **Cache the read path, not the write path** - Writes should invalidate, not update cache
5. **Critical data shouldn't be cached** - Or cache with very short TTLs and explicit invalidation
6. **Monitor your cache hit rate** - If it's too low, you're over-invalidating
7. **Trust issues are normal** - Cache invalidation is legitimately difficult

## Conclusion

Your cache has trust issues because the world is untrustworthy. Data changes. Networks fail. Events get lost. Clocks drift.

The best you can do is:
1. Accept that cache will occasionally be stale
2. Design systems that tolerate staleness
3. Invalidate aggressively for critical data
4. Monitor and adjust TTLs based on real behavior

And maybe, just maybe, your cache will learn to trust again.

**Remember:** The only thing worse than a stale cache is no cache at all. And the only thing worse than no cache is a cache that lies to you.