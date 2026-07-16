---
layout: post
unique_id: WEB04

title: Building a Website in 100 Bytes - The Ridiculous Art of Code Golf for Production
subtitle: How small can you make a functional website? Let's find out.
tldr: Can you fit an entire website in a tweet? In a QR code? In 100 bytes? Let's explore extreme optimization, single-file deployments, and whether minimalism is genius or madness.
# permalink: /blog/web/website-in-100-bytes
author: srungta
tags:
  - Web
  - Optimization
  - Performance
  - Fun

series:
  id: WEB
  index: 5
---


## The Challenge: 100 Bytes or Less

Can you build a functional website in 100 bytes?

Not 100 KB. Not 100 lines of code. **100 bytes.**

That's roughly the length of this sentence. That's smaller than most favicons. That's fewer characters than a typical tweet.

Let's try.

## Attempt 1: The Absolute Minimum

```html
<h1>Hi</h1>
```

**Size:** 11 bytes  
**Does it work?** Yes. Browsers are remarkably forgiving.  
**Is it useful?** Debatable.

You can literally save this as `index.html` and serve it. It's a valid website. Congratulations, you've built a website in 11 bytes.

## Attempt 2: Add Some Style

```html
<h1 style="color:red">Hi</h1>
```

**Size:** 31 bytes  
**Does it work?** Yes.  
**Is it better?** Marginally. At least now it's red.

## Attempt 3: Make It Interactive

```html
<button onclick="alert('Hi')">Click</button>
```

**Size:** 42 bytes  
**Does it work?** Yes!  
**Is it useful?** You can click a button and get an alert. That's interaction. That's JavaScript. We're practically building React.

## Attempt 4: An Entire App in 100 Bytes

Let's build a counter app.

```html
<button onclick="this.innerHTML++">0</button>
```

**Size:** 43 bytes  
**What it does:**
- Displays a number
- When you click it, the number increments
- No external dependencies
- No framework
- No build step
- It's a complete, functional, interactive application

**Is this production-ready?** Surprisingly, yes. I've seen worse in production.

## The Philosophy: How Small Can You Go?

This isn't just about being cute. There are legitimate reasons to care about size:

### 1. Performance
Every byte you send is a byte the user has to download. Smaller = faster, especially on slow connections.

### 2. Constraints Breed Creativity
When you can't use libraries, you think about the problem differently.

### 3. Learning
Stripping away frameworks forces you to understand how the web actually works.

### 4. Embedding
Sometimes you need to fit code in a QR code, a URL, or a database field. Size matters.

## Real-World Minimalism

Let's look at progressively larger but still tiny websites.

### The 1 KB Website (1,024 bytes)

What can you fit in 1 KB?

```html
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Todo</title>
<style>
body{font-family:sans-serif;margin:2em}
input{padding:.5em;width:20em}
button{padding:.5em}
</style>
</head>
<body>
<h1>Todo</h1>
<input id="i" placeholder="Add task">
<button onclick="d.innerHTML+='<li>'+i.value;i.value=''">Add</button>
<ul id="d"></ul>
</body>
</html>
```

**Size:** ~300 bytes (we have room to spare!)  
**What it does:**
- A todo list
- Add items
- They appear in a list
- It looks decent

**What it doesn't have:**
- Delete functionality (we're out of bytes)
- Persistence (refreshing loses everything)
- Validation (you can add empty tasks)
- Accessibility (no ARIA labels)

But it works! And it's under 1 KB!

### The Data URL Trick

You can encode an entire website in a URL:

```
data:text/html,<h1>Hello World</h1>
```

Copy that into your browser's address bar. It loads. It's a website. It's **36 bytes** and it lives entirely in a URL.

You can get creative:

```
data:text/html,<button onclick="alert(Date())">What time is it?</button>
```

Now you have a clock app that lives in a URL.

### The JavaScript Bookmarklet

Bookmarklets are JavaScript that runs on any page. You can fit entire tools in a bookmark.

```javascript
javascript:(()=>{alert(document.body.innerText.length+' chars')})()
```

This counts characters on any webpage. It's a complete tool in 67 bytes.

## Techniques for Going Smaller

### 1. Remove Whitespace

```html
<!-- Before: 50 bytes -->
<h1>
  Hello World
</h1>

<!-- After: 19 bytes -->
<h1>Hello World</h1>
```

Whitespace is for humans. Computers don't care.

### 2. Omit Optional Tags

HTML is surprisingly forgiving:

```html
<!-- Valid HTML -->
<!DOCTYPE html>
<html>
<head>
<title>Page</title>
</head>
<body>
<h1>Hello</h1>
</body>
</html>

<!-- Also valid HTML -->
<!DOCTYPE html>
<title>Page</title>
<h1>Hello</h1>
```

Browsers auto-fill missing tags. You can skip `<html>`, `<head>`, and `<body>`.

### 3. Use Short Variable Names

```javascript
// Before
function incrementCounter() {
  const currentValue = parseInt(this.innerHTML);
  this.innerHTML = currentValue + 1;
}

// After
onclick="this.innerHTML++"
```

Nobody said it had to be readable.

### 4. Inline Everything

External files add bytes for the file request. Inline CSS and JS are cheaper.

```html
<!-- Costs: HTML + CSS file + JS file -->
<link rel="stylesheet" href="style.css">
<script src="app.js"></script>

<!-- Costs: Just HTML -->
<style>body{margin:0}</style>
<script>alert('Hi')</script>
```

### 5. Use HTML Attributes Instead of CSS

```html
<!-- CSS: 40 bytes -->
<style>body{color:red}</style><body>Hi</body>

<!-- Attribute: 28 bytes -->
<body text=red>Hi</body>
```

Old-school HTML attributes are often shorter than CSS.

### 6. Abuse Global Variables

```html
<!-- Verbose -->
<button onclick="document.getElementById('d').innerHTML++">+</button>
<div id="d">0</div>

<!-- Shorter -->
<button onclick="d.innerHTML++">+</button>
<div id="d">0</div>
```

Elements with `id` attributes become global variables. It's terrible practice. It saves bytes.

## The 280-Character Website (Twitter Length)

Can you build something useful in a tweet?

```html
<input id=i><button onclick="d.innerHTML='<li>'+i.value;i.value='';i.focus()">+</button><ul id=d>
```

**What it does:** Single-item todo list. You can only have one task at a time. When you add a new one, the old one disappears.

**Size:** 95 bytes  
**Is it useful?** Surprisingly, yes. It's a notebook. Write a thing, replace it with another thing.

## The QR Code Challenge

QR codes can store about 3 KB of data. Can you fit a useful website in a QR code?

**Yes.**

You can:
1. Build a small website
2. Encode it as a data URL
3. Put it in a QR code
4. Scan the QR code with your phone
5. Your phone loads the website

No internet required. The website lives entirely in the QR code.

**Use cases:**
- Event tickets with interactive features
- Business cards that are also websites
- Treasure hunts where clues are QR codes
- Art projects

## Production Examples (Surprisingly Real)

### 1. Google's AMP Stories

AMP enforces strict size limits. Some AMP pages are under 50 KB total, including images (as data URLs).

### 2. Tiny Websites for Embedded Systems

IoT devices with web interfaces often have < 1 MB of storage. Every byte counts.

### 3. Emergency Payloads

Some systems keep a "degraded mode" HTML page that's tiny enough to fit in cache when everything else fails.

### 4. Static Site Generators Output

Some blogs optimize to under 10 KB per page. It's possible to be small and useful.

## The Diminishing Returns Curve

At some point, smaller stops being better:

- **< 100 bytes:** Impressive but useless
- **< 1 KB:** Cute demos, occasionally useful
- **< 10 KB:** Actually practical for simple sites
- **< 100 KB:** Most websites should aim for this
- **> 1 MB:** You've added too many frameworks

The sweet spot for most websites is 10-100 KB.

## Key Takeaways

1. **HTML is forgiving** - Browsers auto-fill missing tags
2. **Inline is cheaper** - For small sites, inline everything
3. **Whitespace is expensive** - Every space counts
4. **Global variables save bytes** - But make your code terrible
5. **Constraints breed creativity** - Limited bytes force clever solutions
6. **Data URLs are magic** - Websites can live in URLs
7. **Most websites are bloated** - You probably don't need that framework

## Conclusion

Can you build a website in 100 bytes? **Yes.**  
Should you? **Probably not.**  
Is it fun? **Absolutely.**

The point isn't to build production apps in 100 bytes. The point is to understand what's actually necessary and what's just comfortable.

Every framework, every library, every line of CSS - it all costs bytes. Sometimes those bytes are worth it. But sometimes you realize you're shipping 2 MB of JavaScript to change the text on a button.

Next time you're about to `npm install`, pause and ask: "Could I do this in 100 bytes?"

You probably can't. But the exercise of trying will make you a better developer.

**Remember:** The best code is the code you don't write. The second-best code is the code that fits in a tweet.

---

*Have you built something ridiculously small? Found a creative use for data URLs? Show me - I love tiny code.*
