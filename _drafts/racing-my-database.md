---
layout: post
unique_id: WEB03

title: Racing My Database - When Two Users Click Buy at the Exact Same Millisecond
subtitle: Concert tickets, limited edition sneakers, and the last slice of pizza
tldr: What happens when two people try to buy the same thing at the exact same time? Race conditions, inventory overbooking, angry customers, and a deep dive into optimistic vs pessimistic locking with fun examples you can actually understand.
# permalink: /blog/web/racing-my-database
author: srungta
tags:
  - Web
  - System Design
  - Database
  - Concurrency

series:
  id: WEB
  index: 4
---

* TOC
{:toc}

## The Setup: One Ticket, Two Buyers

You're selling the last ticket to see Taylor Swift. It's 10:00:00.000 AM.

- Alice clicks "Buy" at 10:00:00.001
- Bob clicks "Buy" at 10:00:00.001

Same millisecond. Both requests hit your server. Who gets the ticket?

**What actually happens:**  
Both of them get the ticket. You've now sold 2 tickets for 1 seat. Congratulations, you've just discovered race conditions.

## Why This Is Harder Than It Looks

Here's the naive code that everyone writes first:

```javascript
async function buyTicket(userId, ticketId) {
  const ticket = await db.query('SELECT * FROM tickets WHERE id = ?', [ticketId]);
  
  if (ticket.available) {
    await db.query('UPDATE tickets SET available = false, owner = ? WHERE id = ?', 
      [userId, ticketId]);
    return { success: true };
  }
  
  return { success: false, message: 'Ticket already sold' };
}
```

**What's wrong with this?**

Between the `SELECT` and the `UPDATE`, the universe continues to exist. Other requests happen. Other databases queries run. Other users click buttons.

Both Alice and Bob's requests execute the `SELECT` at the same time. Both see `available = true`. Both proceed to the `UPDATE`. Both succeed.

## Visualizing the Race

Let's see this in slow motion:

```
Time    Alice's Request              Bob's Request                Database State
-----   --------------------------   --------------------------   -----------------
T0                                                                 tickets.available = true

T1      SELECT * FROM tickets        SELECT * FROM tickets        tickets.available = true
        -> sees available = true     -> sees available = true

T2      UPDATE tickets               UPDATE tickets               tickets.available = false
        SET available = false        SET available = false        tickets.owner = Alice
                                                                   
T3                                                                 tickets.owner = Bob
                                                                   (Bob overwrote Alice!)
```

Alice got overwritten. Bob thinks he won. Alice thinks she won. You now have 2 angry users and 1 ticket.

## Solution 1: Pessimistic Locking (The Bouncer)

**The idea:** Lock the row so nobody else can touch it while you're working on it.

```sql
START TRANSACTION;
SELECT * FROM tickets WHERE id = ? FOR UPDATE;  -- This locks the row
-- Nobody else can read or modify this row until we're done
UPDATE tickets SET available = false, owner = ? WHERE id = ?;
COMMIT;
```

**How it works:**

```
Time    Alice's Request              Bob's Request                Database State
-----   --------------------------   --------------------------   -----------------
T0                                                                 tickets.available = true

T1      SELECT ... FOR UPDATE        SELECT ... FOR UPDATE        🔒 Locked by Alice
        -> LOCK ACQUIRED             -> WAITING...                

T2      UPDATE tickets               (still waiting)              tickets.owner = Alice
        SET available = false                                     tickets.available = false
        COMMIT                                                    🔓 Unlocked
                                                                   
T3                                   -> LOCK ACQUIRED             Bob sees available = false
                                     -> Ticket already sold       -> Returns error
```

**Analogy:** It's like putting a bouncer in front of the ticket. Alice gets there first, bouncer says "Alice is handling this, Bob you wait." When Alice is done, Bob gets in but the ticket is gone.

**The Good:**
- Simple to understand
- Guarantees consistency
- No surprises

**The Bad:**
- Slower - Bob has to wait even though the answer is "no"
- If Alice's request hangs, Bob waits forever
- Locks can cause deadlocks if you're not careful

## Solution 2: Optimistic Locking (The Version Number)

**The idea:** Don't lock anything. Just check if someone else changed it while you were working.

```javascript
async function buyTicket(userId, ticketId) {
  const ticket = await db.query('SELECT * FROM tickets WHERE id = ?', [ticketId]);
  
  if (!ticket.available) {
    return { success: false, message: 'Ticket already sold' };
  }
  
  // Try to update, but only if the version is still the same
  const result = await db.query(
    'UPDATE tickets SET available = false, owner = ?, version = version + 1 WHERE id = ? AND version = ?',
    [userId, ticketId, ticket.version]
  );
  
  if (result.affectedRows === 0) {
    // Someone else updated it first, try again
    return { success: false, message: 'Someone beat you to it, please try again' };
  }
  
  return { success: true };
}
```

**How it works:**

```
Time    Alice's Request              Bob's Request                Database State
-----   --------------------------   --------------------------   -----------------
T0                                                                 tickets.version = 1
                                                                   tickets.available = true

T1      SELECT * FROM tickets        SELECT * FROM tickets        Both see version = 1
        -> version = 1               -> version = 1

T2      UPDATE tickets               UPDATE tickets               Alice updates first
        WHERE version = 1            WHERE version = 1            version = 2
        -> SUCCESS (1 row updated)   -> FAIL (0 rows updated)     owner = Alice
                                     
T3                                   Retry? Or show error?
```

**Analogy:** It's like writing your name on a napkin to save a table at a restaurant. When you come back with your food, if someone else's name is on the napkin, you know someone took your table.

**The Good:**
- Faster - no waiting for locks
- Better for read-heavy workloads
- No deadlocks

**The Bad:**
- Retry logic is annoying to implement
- User sees "try again" errors
- Doesn't work well for high-contention scenarios (everyone retrying at once)

## Solution 3: Atomic Operations (The Magic Counter)

**The idea:** Let the database handle the logic in a single atomic operation.

```sql
-- Instead of SELECT then UPDATE, do it all at once
UPDATE tickets 
SET available = false, 
    owner = ? 
WHERE id = ? 
  AND available = true;

-- Check how many rows were updated
-- If 0, someone else got there first
-- If 1, you won!
```

**How it works:**

The database guarantees that `UPDATE` statements are atomic. Only one request can succeed.

```
Time    Alice's Request              Bob's Request                Database State
-----   --------------------------   --------------------------   -----------------
T0                                                                 tickets.available = true

T1      UPDATE tickets               UPDATE tickets               Database processes Alice first
        WHERE available = true       WHERE available = true       -> Alice: 1 row updated
        -> 1 row updated             -> 0 rows updated            tickets.available = false
                                                                   tickets.owner = Alice
```

**Analogy:** It's like a race to pull a fire alarm. The alarm only triggers once, and whoever pulls it first wins. Everyone else pulls a disabled alarm.

**The Good:**
- Fastest solution
- No locks, no versions, no retries
- Perfectly safe

**The Bad:**
- Only works for simple cases
- Doesn't tell you *why* it failed (was it sold, or did validation fail?)
- Not all operations can be made atomic

## Real-World Scenario 1: Limited Edition Sneaker Drop

Supreme releases 100 pairs of sneakers. 10,000 people click "Add to Cart" at the same millisecond.

**If you use pessimistic locking:**
- 10,000 requests queue up
- Each request takes 50ms (SELECT, UPDATE, COMMIT)
- Total time: 500 seconds = 8.3 minutes
- The last person waits 8 minutes to find out the sneakers are gone

**If you use optimistic locking:**
- All 10,000 requests hit the database at once
- 9,900 of them get "try again" errors
- They retry immediately
- Your database melts under 10,000+ queries per second

**If you use atomic operations:**
- All 10,000 requests hit at once
- Database processes them one by one (microseconds each)
- 100 succeed, 9,900 fail cleanly
- Total time: a few seconds

**Winner:** Atomic operations, but you need retry limits to prevent angry users from hammering retry.

## Real-World Scenario 2: Bank Account Transfer

Alice has $100. She tries to transfer $100 to Bob and $100 to Charlie at the same time.

**Naive approach:**
```javascript
const balance = await getBalance(alice);
if (balance >= amount) {
  await deduct(alice, amount);
  await add(recipient, amount);
}
```

Both transfers check balance, see $100, both proceed. Alice now has -$100.

**Pessimistic locking approach:**
```sql
START TRANSACTION;
SELECT balance FROM accounts WHERE id = ? FOR UPDATE;  -- Lock Alice's account
-- Check balance, deduct, add
COMMIT;  -- Unlock
```

Second transfer waits for first to complete. Only one succeeds.

**Atomic operation approach:**
```sql
UPDATE accounts 
SET balance = balance - ? 
WHERE id = ? 
  AND balance >= ?;
-- If 0 rows updated, insufficient funds
```

Both transfers hit at once. Database ensures balance never goes negative. One succeeds, one fails.

**Winner:** Atomic operations, but banking systems usually use pessimistic locks because the stakes are higher and waiting 50ms is acceptable.

## The Inventory Overbooking Problem

Let's say you have 5 concert tickets. 10 people try to buy them.

**What usually happens in practice:**

```javascript
// Check if tickets available
const available = await db.query('SELECT COUNT(*) FROM tickets WHERE available = true');

if (available.count > 0) {
  // Grab one ticket (but which one?)
  const ticket = await db.query('SELECT * FROM tickets WHERE available = true LIMIT 1');
  
  // Mark it as sold
  await db.query('UPDATE tickets SET available = false, owner = ? WHERE id = ?', 
    [userId, ticket.id]);
}
```

**The race condition:**

Between counting and updating, other requests grab tickets. You might:
- Tell someone tickets are available, then fail the purchase
- Sell the same ticket twice
- Create phantom inventory

**The fix:** Use a queue system.

```javascript
// Add purchase request to queue
await redis.lpush('ticket-queue', JSON.stringify({ userId, ticketId }));

// Worker processes queue one at a time
while (true) {
  const request = await redis.brpop('ticket-queue', 0);
  await processPurchase(request);
}
```

Now purchases happen in order. No race conditions. First come, first served.

## Things That Make This Worse

### 1. Distributed Systems

If you have multiple database servers, locking gets complicated. `FOR UPDATE` only locks on one server.

**Solution:** Use distributed locks (Redis, ZooKeeper) or partition data so each item only lives on one server.

### 2. Caching

```javascript
// Check cache first
const ticket = await cache.get(`ticket:${ticketId}`);
if (ticket.available) {
  // Cache says it's available, but is it really?
  await db.update(...);
}
```

Cache adds another layer of race conditions. Cache might be stale.

**Solution:** Don't cache inventory. Or use cache-aside pattern and always check database for final validation.

### 3. Microservices

```javascript
// Service A checks inventory
const available = await inventoryService.check(ticketId);

// Service B processes payment
await paymentService.charge(userId, amount);

// Service A updates inventory (but it might be gone now!)
await inventoryService.markSold(ticketId);
```

Multiple services = multiple opportunities to race.

**Solution:** Sagas, two-phase commit, or event sourcing. All of which are complex and deserve their own blog post.

## Key Takeaways

1. **Race conditions are everywhere** - Any time you read then write, you have a race
2. **Pessimistic locking is safe but slow** - Use it when consistency is critical
3. **Optimistic locking is fast but needs retries** - Use it for low-contention scenarios
4. **Atomic operations are fastest** - Use them whenever possible
5. **Test with concurrent requests** - Your app might work fine with 1 user, break with 100
6. **Queues solve a lot of problems** - When in doubt, serialize the work

## Conclusion

Next time you're building a feature where multiple users might want the same thing, pause and think: "What happens if two users click at the exact same millisecond?"

If your answer is "I don't know," you're about to sell 2 tickets for 1 seat.

If your answer is "It's fine, that'll never happen," I have bad news about the laws of probability and Murphy's Law.

And if your answer is "I'll use atomic operations with a queue fallback and monitor contention metrics," then congratulations, you're either a database expert or you've been burned before.

**Remember:** The database doesn't care about your feelings. It will happily sell the same thing twice if you let it.

---

*Have you oversold inventory in production? Resolved a gnarly race condition? I'd love to hear your war stories.*
