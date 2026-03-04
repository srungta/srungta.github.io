---
layout: post
unique_id: WEB06

title: The Internet is Held Together by Duct Tape
subtitle: A tour of terrible but working solutions that power the web
tldr: JSONP, CORS preflight, HTTP polling before WebSockets, base64 images in CSS - explore the ugly hacks that were supposed to be temporary but lasted decades. The internet is a beautiful disaster.
permalink: /blog/web/internet-duct-tape
author: srungta
tags:
  - Web
  - History
  - System Design

series:
  id: WEB
  index: 2
isNew: true
---

* TOC
{:toc}

# The tech debt of the Internet

The internet is a miracle of engineering. It is also held together by hacks, workarounds, and solutions that made everyone say "this is temporary until we fix it properly."

Some of these we use everyday without noticing. Lets see how they came to be.

## Hack 1: [JSONP][jsonp] (JavaScript Object Notation with Padding)

### The Problem

You want to fetch data from a different domain. The browser says no:

```javascript
fetch("https://api.example.com/data")
  .then((r) => r.json())
  .then((data) => console.log(data));

// ❌ Error: No 'Access-Control-Allow-Origin' header
```

[Same-origin policy][same-origin] blocks you. In the mid 2000s, [CORS][cors] doesn't exist yet. What do you do?

### The Terrible Solution

**Observation:** `<script>` tags can load JavaScript from anywhere.

**Terrible idea:** What if we put JSON data _inside_ a JavaScript file?

```javascript
// Your page
function handleData(data) {
  console.log(data);
}

// Their server returns this:
handleData({ user: "Alice", email: "alice@example.com" });

// You load it with a script tag:
<script src="https://api.example.com/data?callback=handleData"></script>;
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

## Hack 2: [CORS Preflight][preflight] (The OPTIONS Request Nobody Wanted)

### The Problem

It is 2005 and CORS exists now! You can make cross-origin requests! Except... sometimes the browser sends TWO requests:

```javascript
fetch("https://api.example.com/data", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ data: "hi" }),
});

// Browser sends:
// 1. OPTIONS request (preflight)
// 2. POST request (your actual request)
```

**Why two requests?** Because the browser doesn't trust you (and rightly so!).

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
- [`Access-Control-Max-Age`][max-age] is supposed to cache the preflight, but browsers cap it (Chrome ~2 hours, Firefox ~24 hours)
- Many developers don't know why OPTIONS requests exist and misconfigure their servers

**Why it exists:**  
Security. The browser wants to protect the server from dangerous requests. But also backward compatibility - old servers that don't understand CORS shouldn't accidentally accept dangerous requests.

**Status in 2026:** Still here. Still annoying. Still necessary. Will outlive us all.

## Hack 3: HTTP Polling (Asking "Are We There Yet?" Every Second)

### The Problem (2005)

You want real-time updates. [WebSockets][websockets] don't exist. How do you get the server to push data to the client?

### The Terrible Solution

Just ask the server for updates every second:

```javascript
setInterval(() => {
  fetch("/updates")
    .then((r) => r.json())
    .then((data) => {
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

**[Long polling][long-polling]:** Keep the connection open until there's data

```javascript
function poll() {
  fetch("/updates")
    .then((r) => r.json())
    .then((data) => {
      handleData(data);
      poll(); // Immediately poll again
    });
}
```

Server holds the request open until there's data, then responds. Client immediately polls again.

**Why it's also terrible:** Keeps connections open forever. But at least it doesn't waste requests when nothing happens.

**Status in 2026:** WebSockets exist now. But polling still lives on in:

- Systems that can't use WebSockets (restrictive firewalls)
- "Enterprise" systems that haven't been updated since 2008
- Systems that consider Server Sent Events and WebSockets too complex a solution for their use case.

## Hack 4: Base64 Images in CSS

### The Problem

[HTTP/1.1][http11] has a limit on concurrent connections. Every image is a separate request. Loading 50 icons = 50 requests = slow.

### The Terrible Solution

Encode images as [base64][base64] strings and embed them directly in CSS as [data URLs][data-urls]:

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
- No [FOUC][fouc] (Flash of Unstyled Content) waiting for images

**Status in 2026:** [HTTP/2][http2] fixed the connection limit problem. But you still see base64 images in:

- Old codebases
- Email HTML (email clients block external images)
- Single-file HTML apps (everything in one file)
- Systems where image hosting over CDNs is relatively expensive.
- The image is small enough, what's the harm?(!)

## Hack 5: [User-Agent][user-agent] Sniffing

### The Problem

Different browsers support different features. You need to know which browser the user has.

### The Terrible Solution

Check the `User-Agent` string:

```javascript
const ua = navigator.userAgent;

if (ua.includes("MSIE") || ua.includes("Trident")) {
  // Internet Explorer detected
  loadIEPolyfills();
}

if (ua.includes("Chrome")) {
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

This is Edge pretending to be Chrome pretending to be Safari pretending to be Mozilla. Why? Because if a website blocked Edge, this partially circumvents the ban.

{% capture core_insight %}
A much better approach is to use [Feature detection][feature-detection]. Check for presence of the feature in your JS
**Example:**

```javascript
if ("geolocation" in navigator) {
  // Use geolocation
}

if (typeof Promise !== "undefined") {
  // Use promises
}
```

{% endcapture %}
{% include highlight.html title="Feature detection" content=core_insight %}

**Status in 2026:** User-Agent sniffing is officially discouraged. But it's still everywhere because old code never dies.

## Hack 6: [Cookies][cookies] for Everything

### The Problem (1994)

HTTP is stateless. You need to remember who the user is between requests.

### The Terrible Solution

[Cookies][cookies]! A small piece of data sent with every request:

```
Set-Cookie: sessionId=abc123; Path=/; HttpOnly; Secure
```

**Why it's terrible:**

- Sent with EVERY request, even for images/CSS/JS
- Limited to 4 KB per cookie
- No structured data format
- Global scope by default (every subdomain can read it)
- Security nightmare ([XSS][xss] can steal cookies, [CSRF][csrf] exploits them)

**Why it lasted:**  
Because nothing better existed. We needed some way to do sessions.

**What cookies are used for:**

- Authentication (session tokens)
- Tracking (ads, analytics)
- User preferences
- Shopping carts
- CSRF tokens (ironically, to protect against CSRF)

**Status in 2026:** We have [`localStorage`][localstorage], [`sessionStorage`][sessionstorage], [`IndexedDB`][indexeddb]. But cookies persist because:

- They're automatically sent with requests (good for auth)
- They work across tabs
- Old code depends on them

## Hack 7: [document.write()][document-write] (The Original Sin)

### The Problem

You want to add content to a page dynamically.

### The Terrible Solution

```javascript
document.write("<div>Hello World</div>");
```

**Why it's terrible:**

- If called after page load, it WIPES THE ENTIRE PAGE
- Blocks page parsing
- Can't be used in async scripts
- Messes with the DOM
- Everyone who has used it has a horror story

**Why it existed:**  
In 1995, there was no [DOM API][dom-api]. `document.write()` was the only way to generate HTML from JavaScript.

**Status in 2026:** Not officially deprecated in the spec, but strongly discouraged. (See the mozilla document page on this and you will realize how red it is with warnings.) Chrome actively blocks it in some scenarios. Still in millions of ad scripts because ad tech is where code goes to die.

> It was a reliable way to ensure the ad script executed and rendered its content across a variety of older browser environments without needing more complex DOM manipulation methods. Ad scripts often use document.write() to inject further <script> tags with dynamic parameters, effectively creating a chain of script loads to fetch the final ad creative

## Hack 8: [eval()][eval] (The Devil's Function)

### The Problem

You need to execute dynamically constructed code. Maybe you're parsing a data format (before [`JSON.parse()`][json-parse] existed), maybe you're building a template engine, or maybe you're just making questionable life choices.

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

## Hack 9: The **<table>** Layout Era

### The Problem (1995)

You want to create a layout with columns. CSS layout support barely exists.

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

> Please just use flexbox or css grids for your layouting.

## Hack 10: [!important][css-important] (The CSS Nuclear Option)

### The Problem

Your CSS rule isn't being applied. Something else is overriding it. You don't know what, and you don't have time to figure it out.

### The Terrible Solution

```css
.button {
  color: red !important;
  background: blue !important;
  margin: 10px !important;
  /* I don't understand the cascade and at this point I'm afraid to ask */
}
```

**Why it's terrible:**

- Breaks the natural [cascade][css-cascade] that makes CSS work
- The only way to override `!important` is with another `!important`
- Leads to specificity wars that nobody wins
- Makes CSS unmaintainable — you can't tell what's overriding what
- Commonly a sign that the real problem is poorly structured selectors

**Why it's used:**

- Third-party widgets inject styles you can't control
- Legacy CSS is too tangled to refactor safely
- Deadline pressure: "just slap `!important` on it and ship"
- It always works (that's the dangerous part)

**Status in 2026:** Alive and thriving. Every codebase has at least one `!important`. Most have hundreds. [CSS-in-JS][css-in-js] and utility frameworks like [Tailwind][tailwind] reduce the need, but whenever CSS gets complicated, `!important` is the first thing developers reach for.

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

---

[jsonp]: https://en.wikipedia.org/wiki/JSONP "JSONP - Wikipedia"
[same-origin]: https://developer.mozilla.org/en-US/docs/Web/Security/Same-origin_policy "Same-origin policy - MDN"
[cors]: https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS "Cross-Origin Resource Sharing (CORS) - MDN"
[preflight]: https://developer.mozilla.org/en-US/docs/Glossary/Preflight_request "Preflight request - MDN"
[max-age]: https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Max-Age "Access-Control-Max-Age - MDN"
[websockets]: https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API "WebSockets API - MDN"
[long-polling]: https://en.wikipedia.org/wiki/Push_technology#Long_polling "Long polling - Wikipedia"
[http11]: https://datatracker.ietf.org/doc/html/rfc2616 "RFC 2616 - HTTP/1.1"
[http2]: https://datatracker.ietf.org/doc/html/rfc7540 "RFC 7540 - HTTP/2"
[base64]: https://developer.mozilla.org/en-US/docs/Glossary/Base64 "Base64 - MDN"
[data-urls]: https://developer.mozilla.org/en-US/docs/Web/URI/Schemes/data "Data URLs - MDN"
[fouc]: https://en.wikipedia.org/wiki/Flash_of_unstyled_content "Flash of unstyled content - Wikipedia"
[user-agent]: https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/User-Agent "User-Agent - MDN"
[feature-detection]: https://developer.mozilla.org/en-US/docs/Learn/Tools_and_testing/Cross_browser_testing/Feature_detection "Feature detection - MDN"
[cookies]: https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies "HTTP Cookies - MDN"
[xss]: https://owasp.org/www-community/attacks/xss/ "Cross-Site Scripting (XSS) - OWASP"
[csrf]: https://owasp.org/www-community/attacks/csrf "Cross-Site Request Forgery (CSRF) - OWASP"
[localstorage]: https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage "localStorage - MDN"
[sessionstorage]: https://developer.mozilla.org/en-US/docs/Web/API/Window/sessionStorage "sessionStorage - MDN"
[indexeddb]: https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API "IndexedDB API - MDN"
[document-write]: https://developer.mozilla.org/en-US/docs/Web/API/Document/write "document.write() - MDN"
[dom-api]: https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model "Document Object Model (DOM) - MDN"
[eval]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/eval "eval() - MDN"
[json-parse]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/parse "JSON.parse() - MDN"
[css-important]: https://developer.mozilla.org/en-US/docs/Web/CSS/important "!important - MDN"
[css-cascade]: https://developer.mozilla.org/en-US/docs/Web/CSS/Cascade "CSS Cascade - MDN"
[css-in-js]: https://en.wikipedia.org/wiki/CSS-in-JS "CSS-in-JS - Wikipedia"
[tailwind]: https://tailwindcss.com/ "Tailwind CSS"
