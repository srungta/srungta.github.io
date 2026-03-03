---
layout: post
unique_id: WEB06

title: The Internet is Held Together by Duct Tape
subtitle: A tour of terrible but working solutions that power the web
tldr: JSONP, CORS preflight, HTTP polling before WebSockets, base64 images in CSS - explore the ugly hacks that were supposed to be temporary but lasted decades. The internet is a beautiful disaster.
# permalink: /blog/web/internet-duct-tape
author: srungta
tags:
  - Web
  - History
  - System Design
  - Humor

series:
  id: WEB
  index: 7
---

* TOC
{:toc}

## The Premise: Nothing Here Was Supposed to Last

The internet is a miracle of engineering. It's also held together by hacks, workarounds, and solutions that made everyone say "this is temporary until we fix it properly."

Spoiler: We never fixed it properly.

Let's tour some of the most beautiful disasters in web technology.

## Hack 1: JSONP (JavaScript Object Notation with Padding)

### The Problem

You want to fetch data from a different domain. The browser says no:

```javascript
fetch('https://api.example.com/data')
  .then(r => r.json())
  .then(data => console.log(data));

// ❌ Error: No 'Access-Control-Allow-Origin' header
```

Same-origin policy blocks you. CORS doesn't exist yet (it's 2005). What do you do?

### The Terrible Solution

**Observation:** `<script>` tags can load JavaScript from anywhere.

**Terrible idea:** What if we put JSON data *inside* a JavaScript file?

```javascript
// Your page
function handleData(data) {
  console.log(data);
}

// Their server returns this:
handleData({"user": "Alice", "email": "alice@example.com"});

// You load it with a script tag:
<script src="https://api.example.com/data?callback=handleData"></script>
```

**It works!** The server wraps JSON in a function call. Your page defines the function. Script tag loads and executes. You have your data.

**Why it's terrible:**
- The server can execute arbitrary JavaScript in your page
- No error handling
- URL length limits
- Can only do GET requests
- The word "padding" is a euphemism for "wrapping JSON in a function call like savages"

**Why it lasted so long:**  
Because it worked. And CORS took years to standardize and implement everywhere.

**Status in 2026:** Officially dead. Unofficially, someone somewhere is still using it and their code will break when browsers finally remove support.

## Hack 2: CORS Preflight (The OPTIONS Request Nobody Wanted)

### The Problem

CORS exists now! You can make cross-origin requests! Except... sometimes the browser sends TWO requests:

```javascript
fetch('https://api.example.com/data', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ data: 'hi' })
});

// Browser sends:
// 1. OPTIONS request (preflight)
// 2. POST request (your actual request)
```

**Why two requests?** Because the browser doesn't trust you.

### The Terrible Solution

The OPTIONS request is a "pre-flight" check. The browser asks the server: "Is it okay if I send a POST request with this header?"

```
OPTIONS /data HTTP/1.1
Host: api.example.com
Origin: https://yoursite.com
Access-Control-Request-Method: POST
Access-Control-Request-Headers: Content-Type

// Server responds:
HTTP/1.1 204 No Content
Access-Control-Allow-Origin: https://yoursite.com
Access-Control-Allow-Methods: POST
Access-Control-Allow-Headers: Content-Type
Access-Control-Max-Age: 86400
```

Only then does the browser send your actual POST request.

**Why it's terrible:**
- Doubles the number of requests
- Adds latency
- Server has to handle OPTIONS requests for every endpoint
- `Access-Control-Max-Age` is supposed to cache the preflight, but browsers ignore it for complex requests
- Many developers don't know why OPTIONS requests exist and misconfigure their servers

**Why it exists:**  
Security. The browser wants to protect the server from dangerous requests. But also backward compatibility - old servers that don't understand CORS shouldn't accidentally accept dangerous requests.

**Status in 2026:** Still here. Still annoying. Still necessary. Will outlive us all.

## Hack 3: HTTP Polling (Asking "Are We There Yet?" Every Second)

### The Problem (2005)

You want real-time updates. WebSockets don't exist. How do you get the server to push data to the client?

### The Terrible Solution

Just ask the server for updates every second:

```javascript
setInterval(() => {
  fetch('/updates')
    .then(r => r.json())
    .then(data => {
      if (data.newMessages) {
        showMessages(data.newMessages);
      }
    });
}, 1000); // Ask every second
```

**Why it's terrible:**
- Makes 60 requests per minute even when nothing happens
- Wastes bandwidth
- Wastes server resources
- Wastes battery on mobile devices
- Still has latency (updates only every second)

**Variations:**

**Long polling:** Keep the connection open until there's data

```javascript
function poll() {
  fetch('/updates')
    .then(r => r.json())
    .then(data => {
      handleData(data);
      poll(); // Immediately poll again
    });
}
```

Server holds the request open until there's data, then responds. Client immediately polls again.

**Why it's also terrible:** Keeps connections open forever. But at least it doesn't waste requests when nothing happens.

**Status in 2026:** WebSockets exist now. But polling still lives on in:
- Systems that can't use WebSockets (restrictive firewalls)
- Lazy developers who don't want to set up WebSocket infrastructure
- "Enterprise" systems that haven't been updated since 2008

## Hack 4: Base64 Images in CSS

### The Problem

HTTP/1.1 has a limit on concurrent connections. Every image is a separate request. Loading 50 icons = 50 requests = slow.

### The Terrible Solution

Encode images as base64 strings and embed them directly in CSS:

```css
.icon {
  background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA
AAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL
0Y4OHwAAAABJRU5ErkJggg==);
}
```

**Why it's terrible:**
- Base64 is 33% larger than binary
- Can't be cached separately from CSS
- Makes CSS files huge
- Can't lazy-load images
- Makes CSS unreadable

**Why it was used:**
- Reduces HTTP requests (important in HTTP/1.1)
- Entire CSS file can be cached
- No FOUC (Flash of Unstyled Content) waiting for images

**Status in 2026:** HTTP/2 fixed the connection limit problem. But you still see base64 images in:
- Old codebases
- Email HTML (email clients block external images)
- Single-file HTML apps (everything in one file)

## Hack 5: User-Agent Sniffing

### The Problem

Different browsers support different features. You need to know which browser the user has.

### The Terrible Solution

Check the `User-Agent` string:

```javascript
const ua = navigator.userAgent;

if (ua.includes('MSIE') || ua.includes('Trident')) {
  // Internet Explorer detected
  loadIEPolyfills();
}

if (ua.includes('Chrome')) {
  // Use Chrome-specific features
}
```

**Why it's terrible:**
- User-Agent strings lie
- Browsers spoof each other to avoid being blocked
- User-Agent strings are ridiculously long and complicated
- Feature detection is better than browser detection

**Example User-Agent:**
```
Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 
(KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36 Edg/91.0.864.59
```

This is Edge pretending to be Chrome pretending to be Safari pretending to be Mozilla. Why? Because websites blocked Edge, so Edge pretended to be Chrome.

**Better solution:** Feature detection

```javascript
if ('geolocation' in navigator) {
  // Use geolocation
}

if (typeof Promise !== 'undefined') {
  // Use promises
}
```

**Status in 2026:** User-Agent sniffing is officially discouraged. But it's still everywhere because old code never dies.

## Hack 6: Cookies for Everything

### The Problem (1994)

HTTP is stateless. You need to remember who the user is between requests.

### The Terrible Solution

Cookies! A small piece of data sent with every request:

```
Set-Cookie: sessionId=abc123; Path=/; HttpOnly; Secure
```

**Why it's terrible:**
- Sent with EVERY request, even for images/CSS/JS
- Limited to 4 KB per cookie
- No structured data format
- Global scope by default (every subdomain can read it)
- Security nightmare (XSS can steal cookies, CSRF exploits them)

**Why it lasted:**  
Because nothing better existed. We needed some way to do sessions.

**What cookies are used for:**
- Authentication (session tokens)
- Tracking (ads, analytics)
- User preferences
- Shopping carts
- CSRF tokens (ironically, to protect against CSRF)

**Status in 2026:** We have `localStorage`, `sessionStorage`, `IndexedDB`. But cookies persist because:
- They're automatically sent with requests (good for auth)
- They work across tabs
- Old code depends on them

## Hack 7: `document.write()` (The Original Sin)

### The Problem

You want to add content to a page dynamically.

### The Terrible Solution

```javascript
document.write('<div>Hello World</div>');
```

**Why it's terrible:**
- If called after page load, it WIPES THE ENTIRE PAGE
- Blocks page parsing
- Can't be used in async scripts
- Messes with the DOM
- Everyone who has used it has a horror story

**Why it existed:**  
In 1995, there was no DOM API. `document.write()` was the only way to generate HTML from JavaScript.

**Status in 2026:** Officially deprecated. Still in millions of ad scripts because ad tech is where code goes to die.

## Hack 8: `eval()` (The Devil's Function)

### The Terrible Solution

```javascript
const code = 'console.log("Hello")';
eval(code); // Executes the string as JavaScript
```

**Why it's terrible:**
- Executes arbitrary code
- Security nightmare
- Performance nightmare (can't be optimized)
- Debugging nightmare
- Makes code review impossible

**Why it exists:**  
Sometimes you legitimately need to execute dynamic code. JSONP used `eval()` before `JSON.parse()` existed.

**Status in 2026:** Still exists. Still dangerous. Still used in:
- Code playgrounds
- Template engines
- Dynamic query builders
- Bad decisions

## Hack 9: The `<table>` Layout Era

### The Problem (1995)

You want to create a layout with columns. CSS doesn't exist yet.

### The Terrible Solution

Use HTML tables for everything:

```html
<table>
  <tr>
    <td>Sidebar</td>
    <td>Main Content</td>
  </tr>
</table>
```

**Why it's terrible:**
- Semantically wrong (tables are for data, not layout)
- Accessibility nightmare
- Inflexible
- Nested tables everywhere
- Screen readers think everything is tabular data

**Status in 2026:** Finally dead. If you see table layouts in 2026, the website is either:
- Very old
- Generated by an ancient CMS
- An email (email clients still use table layouts)

## Hack 10: JavaScript Disabled Fallbacks

### The Problem

JavaScript might be disabled. Your site needs to work anyway.

### The Solution That Became Unnecessary

```html
<noscript>
  <p>Please enable JavaScript to use this site.</p>
</noscript>
```

**Why it was important:** In the early 2000s, some users disabled JavaScript for security/performance.

**Status in 2026:**
- < 0.5% of users have JavaScript disabled
- But we still add `<noscript>` tags out of habit
- Modern SPAs (Single Page Apps) don't work at all without JavaScript
- The battle over "should sites work without JS" was lost years ago

## Why These Hacks Matter

### Lesson 1: Temporary Solutions Become Permanent

JSONP was a hack. It was supposed to be replaced by CORS. It lasted 15+ years.

### Lesson 2: Backward Compatibility is Forever

We can't remove old features because someone, somewhere, depends on them.

### Lesson 3: Constraints Breed Creativity

These hacks exist because smart people solved real problems with limited tools.

### Lesson 4: The Perfect Solution Never Comes

CORS is "better" than JSONP, but it's also more complex, has preflight requests, and still frustrates developers daily.

## Key Takeaways

1. **Every hack was once a clever solution** - JSONP was genius in 2005
2. **Temporary hacks become permanent** - Plan accordingly
3. **Backward compatibility preserves terrible ideas** - The web can never fully break old sites
4. **Standards take years** - Hacks fill the gap
5. **Your clever hack will haunt you** - Future you will curse past you

## Conclusion

The internet works. Millions of websites, billions of users, trillions of requests per day. And it's all held together by solutions that were supposed to be temporary.

JSONP. CORS preflight. HTTP polling. Base64 images. Cookies for everything. These are the duct tape and baling wire of the web.

And you know what? **It works.** Not elegantly. Not beautifully. But it works.

Next time you're tempted to call something a "hack," remember: the entire internet is a hack. Your hack is in good company.

**Remember:** Today's elegant solution is tomorrow's "why does this terrible legacy code exist?"

---

*What's your favorite terrible-but-working web hack? Have you maintained code from the JSONP era? Share your horror stories.*
